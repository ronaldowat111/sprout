<?php

namespace App\Services;

use Anthropic\Client;
use App\Models\ChatMessage;
use App\Models\Kid;
use App\Models\PurchaseRequest;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Sprout, the kid's AI money buddy. Runs a tool-use loop against Claude with
 * the tools in CoachTools. If no API key is configured, or the API call
 * fails, a small rule-based coach answers instead so the demo never breaks.
 */
class CoachAgent
{
    private const MAX_TOOL_ROUNDS = 6;

    private const HISTORY = 20;

    public function __construct(private LedgerService $ledger) {}

    public function enabled(): bool
    {
        return filled(config('services.anthropic.key'));
    }

    /**
     * Answers one kid message. Stores both sides of the exchange and returns
     * the assistant message plus whether a purchase request was sent.
     *
     * @return array{message: ChatMessage, requestCreated: bool}
     */
    public function reply(Kid $kid, string $text): array
    {
        $history = $kid->chatMessages()->latest('id')->take(self::HISTORY)->get()->reverse()->values();
        $kid->chatMessages()->create(['role' => 'user', 'content' => $text]);

        $tools = new CoachTools($kid, $this->ledger, app(PurchaseRequestService::class));

        $answer = null;
        if ($this->enabled()) {
            try {
                $answer = $this->askClaude($kid, $history->all(), $text, $tools);
            } catch (Throwable $e) {
                Log::warning('Coach API call failed, using offline coach', ['error' => $e->getMessage()]);
            }
        }

        $answer ??= (new OfflineCoach($kid, $this->ledger, $tools))->reply($text);

        $message = $kid->chatMessages()->create([
            'role' => 'assistant',
            'content' => $answer,
            'choices' => $tools->choices ?: null,
        ]);

        return ['message' => $message, 'requestCreated' => $tools->createdRequestId !== null];
    }

    /** One or two sentences for the parent's approval card. */
    public function summarizeRequest(PurchaseRequest $request): string
    {
        $kid = $request->kid;
        $balance = $this->ledger->balance($kid);
        $after = $balance - $request->amount;
        $facts = sprintf(
            '%s asks for "%s" ($%s). Their reason: "%s". Balance before: $%s, after: $%s. Saved for %s.',
            $kid->name,
            $request->item,
            number_format($request->amount / 100, 2),
            $request->kid_reason,
            number_format($balance / 100, 2),
            number_format($after / 100, 2),
            $request->goal_id ? 'this as a savings goal' : 'no specific goal',
        );
        $fallback = $request->goal_id
            ? "{$kid->name} saved up for this goal and has enough. Paying leaves \$".number_format($after / 100, 2).' in their balance.'
            : "{$kid->name} has enough saved. Paying leaves \$".number_format($after / 100, 2).' in their balance.';

        if (! $this->enabled()) {
            return $fallback;
        }

        try {
            $response = $this->client()->beta->messages->create(
                maxTokens: 16000,
                messages: [['role' => 'user', 'content' => $facts]],
                model: config('services.anthropic.model'),
                system: 'You write a one or two sentence note for a parent deciding whether to approve their child\'s purchase. Neutral and factual: what it is, whether the child saved for it, what is left after. No advice, no emojis.',
                outputConfig: ['effort' => 'low'],
                fallbacks: 'default',
                betas: ['server-side-fallback-2026-07-01'],
            );

            return $this->text($response->content) ?: $fallback;
        } catch (Throwable $e) {
            Log::warning('Request summary failed', ['error' => $e->getMessage()]);

            return $fallback;
        }
    }

    /**
     * Topics practised, one proud moment and one dinner question for the
     * parent's weekly report. The chats go in; only the summary comes out.
     *
     * @param  list<ChatMessage>  $chats
     * @return array{topics: list<string>, proud: string, dinner: string, ai: bool}
     */
    public function weeklyNotes(Kid $kid, array $stats, array $chats): array
    {
        $fallback = $this->offlineNotes($kid, $stats, $chats);

        if (! $this->enabled() || ($chats === [] && $stats['in'] === 0)) {
            return $fallback;
        }

        $transcript = collect($chats)
            ->map(fn ($m) => ($m->role === 'user' ? $kid->name : 'Sprout').': '.$m->content)
            ->join("\n");
        $facts = json_encode($stats, JSON_UNESCAPED_SLASHES);

        try {
            $response = $this->client()->beta->messages->create(
                maxTokens: 16000,
                messages: [['role' => 'user', 'content' => "Week facts (money in cents): {$facts}\n\nChats with Sprout this week:\n{$transcript}"]],
                model: config('services.anthropic.model'),
                system: "You write {$kid->name}'s weekly money report for their parent. Summarise, never quote the chats: the parent must not be able to reconstruct what the child said. topics: 2-4 short money skills practised (e.g. \"Needs vs. wants\", \"Waiting to buy\", \"Goal math\"). proud: one warm, specific sentence about a good money decision this week. dinner: one open question the parent could ask at dinner.",
                outputConfig: [
                    'effort' => 'low',
                    'format' => [
                        'type' => 'json_schema',
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'topics' => ['type' => 'array', 'items' => ['type' => 'string']],
                                'proud' => ['type' => 'string'],
                                'dinner' => ['type' => 'string'],
                            ],
                            'required' => ['topics', 'proud', 'dinner'],
                            'additionalProperties' => false,
                        ],
                    ],
                ],
                fallbacks: 'default',
                betas: ['server-side-fallback-2026-07-01'],
            );

            $data = json_decode($this->text($response->content), true);

            return is_array($data) && isset($data['proud'], $data['dinner'])
                ? ['topics' => array_slice((array) ($data['topics'] ?? []), 0, 4), 'proud' => $data['proud'], 'dinner' => $data['dinner'], 'ai' => true]
                : $fallback;
        } catch (Throwable $e) {
            Log::warning('Weekly notes failed', ['error' => $e->getMessage()]);

            return $fallback;
        }
    }

    private function offlineNotes(Kid $kid, array $stats, array $chats): array
    {
        $text = mb_strtolower(collect($chats)->where('role', 'user')->pluck('content')->join(' '));
        $topics = array_values(array_filter([
            preg_match('/worth|need|want/', $text) ? 'Needs vs. wants' : null,
            preg_match('/wait|save|saving/', $text) ? 'Waiting to buy' : null,
            preg_match('/\$|\d|how long|weeks|goal/', $text) ? 'Goal math' : null,
            $stats['choresDone'] > 0 ? 'Earning with chores' : null,
        ]));
        $goal = $kid->activeGoal;

        $proud = match (true) {
            collect($stats['requests'])->contains('status', 'paid') => "{$kid->name} saved up and asked before buying, then waited for your OK.",
            $stats['choresDone'] > 0 => "{$kid->name} finished {$stats['choresDone']} chore(s) to earn money toward ".($goal?->title ?? 'a goal').'.',
            $stats['spent'] === 0 && $stats['in'] > 0 => "{$kid->name} didn't spend anything this week and kept saving.",
            default => "{$kid->name} kept their savings on track this week.",
        };

        return [
            'topics' => $topics ?: ['Saving toward a goal'],
            'proud' => $proud,
            'dinner' => $goal ? "\"What's the hardest part of waiting for your {$goal->title}?\"" : '"What would you like to save for next?"',
            'ai' => false,
        ];
    }

    /**
     * @param  list<ChatMessage>  $history
     */
    private function askClaude(Kid $kid, array $history, string $text, CoachTools $tools): ?string
    {
        $messages = [];
        foreach ($history as $m) {
            $messages[] = ['role' => $m->role === 'user' ? 'user' : 'assistant', 'content' => $m->content];
        }
        $messages[] = ['role' => 'user', 'content' => $text];
        // The API needs the first turn to be the user's.
        while ($messages[0]['role'] !== 'user') {
            array_shift($messages);
        }

        $client = $this->client();
        $definitions = CoachTools::definitions();

        for ($round = 0; $round <= self::MAX_TOOL_ROUNDS; $round++) {
            $response = $client->beta->messages->create(
                maxTokens: 16000,
                messages: $messages,
                model: config('services.anthropic.model'),
                system: $this->systemPrompt($kid),
                tools: $definitions,
                outputConfig: ['effort' => 'low'],
                fallbacks: 'default',
                betas: ['server-side-fallback-2026-07-01'],
            );

            if ($response->stopReason === 'refusal') {
                return "Hmm, that's one to ask a grown-up about. Want to talk about saving or a goal instead?";
            }

            if ($response->stopReason !== 'tool_use') {
                return $this->text($response->content);
            }

            $results = [];
            foreach ($response->content as $block) {
                if ($block->type !== 'tool_use') {
                    continue;
                }
                try {
                    $results[] = ['type' => 'tool_result', 'toolUseID' => $block->id, 'content' => $tools->run($block->name, (array) $block->input)];
                } catch (Throwable $e) {
                    $results[] = ['type' => 'tool_result', 'toolUseID' => $block->id, 'content' => $e->getMessage(), 'isError' => true];
                }
            }

            $messages[] = ['role' => 'assistant', 'content' => $response->content];
            $messages[] = ['role' => 'user', 'content' => $results];
        }

        return null;
    }

    private function systemPrompt(Kid $kid): string
    {
        $parent = $kid->parent->name;

        return <<<PROMPT
        You are Sprout, a friendly money buddy for {$kid->name}, a kid aged 8 to 12. {$parent} is their parent.

        How you talk:
        - Short, warm sentences and simple words. Two or three sentences, then offer choices with show_choices when there is a decision to make.
        - Never just say "buy it". Help {$kid->name} think first: is it a need or a want? How long would saving for it take? Is there a cheaper option?
        - Use the tools for every number (balance, weeks to a goal, chores). Never guess an amount.

        What you can and cannot do:
        - You cannot spend money. Every purchase must be approved and paid by {$parent}.
        - When {$kid->name} has enough saved and is ready, offer to send a purchase request with their reason. Only call create_purchase_request after they say yes.
        - Never ask for personal information (address, school, passwords) and never mention card or payment details.
        - Never suggest keeping secrets from {$parent}.
        - If asked about something unsafe or unrelated to money, gently steer back to saving, or say it is a question for a grown-up.

        Plain text only: no markdown, no lists, at most one emoji.
        PROMPT;
    }

    private function client(): Client
    {
        return new Client(apiKey: config('services.anthropic.key'));
    }

    private function text(iterable $content): string
    {
        $parts = [];
        foreach ($content as $block) {
            if ($block->type === 'text') {
                $parts[] = $block->text;
            }
        }

        return trim(implode("\n", $parts));
    }
}
