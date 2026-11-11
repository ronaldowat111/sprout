<?php

namespace App\Services;

use App\Models\Kid;
use InvalidArgumentException;

/**
 * The coach's tools. Deliberately no payment tool: the strongest thing the
 * coach can do is send a purchase request, which a parent must approve and
 * pay through PayPal. Money values cross the tool boundary as dollars (easy
 * for the model to read); everything inside the app stays in cents.
 */
class CoachTools
{
    /** Set when create_purchase_request succeeds during this turn. */
    public ?int $createdRequestId = null;

    /** Quick-reply buttons the coach chose to show under its message. */
    public array $choices = [];

    public function __construct(
        private Kid $kid,
        private LedgerService $ledger,
        private PurchaseRequestService $requests,
    ) {}

    public static function definitions(): array
    {
        $none = ['type' => 'object', 'properties' => new \stdClass];

        return [
            [
                'name' => 'get_balance',
                'description' => "The kid's current virtual balance in dollars, weekly allowance, and next allowance day. Call this before talking about whether they can afford something.",
                'inputSchema' => $none,
            ],
            [
                'name' => 'list_goals',
                'description' => 'Active savings goals with target, amount saved so far, percent done and estimated weeks left.',
                'inputSchema' => $none,
            ],
            [
                'name' => 'create_goal',
                'description' => 'Create a new savings goal when the kid clearly says they want to save for something. Ask for the price first if you do not know it.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'title' => ['type' => 'string', 'description' => 'Short name, e.g. "Lego set"'],
                        'target_amount' => ['type' => 'number', 'description' => 'Price in dollars, e.g. 30'],
                    ],
                    'required' => ['title', 'target_amount'],
                ],
            ],
            [
                'name' => 'weeks_to_goal',
                'description' => 'Estimate how many weeks until a goal is affordable, from balance, allowance and average chore earnings. Also returns how much sooner one extra chore a week would make it. Use this instead of doing the maths yourself.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'goal_id' => ['type' => 'integer'],
                        'price' => ['type' => 'number', 'description' => 'Optional: a price in dollars to check instead of a saved goal, e.g. a toy the kid just asked about'],
                    ],
                ],
            ],
            [
                'name' => 'suggest_chores',
                'description' => 'Open chores the parent has posted that the kid could do to earn money faster.',
                'inputSchema' => $none,
            ],
            [
                'name' => 'create_purchase_request',
                'description' => "Send a purchase request to the kid's parent. Only call this after the kid has thought it through AND clearly says they want to ask. The parent decides and pays; you cannot spend money. Fails if the kid has not saved enough yet.",
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'item' => ['type' => 'string', 'description' => 'What they want to buy'],
                        'amount' => ['type' => 'number', 'description' => 'Price in dollars'],
                        'reason' => ['type' => 'string', 'description' => "The kid's reason, in their own words"],
                    ],
                    'required' => ['item', 'amount', 'reason'],
                ],
            ],
            [
                'name' => 'show_choices',
                'description' => 'Show 2 or 3 tap-able reply buttons under your message, e.g. options for a decision. Each needs a short title (what the kid would say) and a one-line detail with the consequence in numbers.',
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'choices' => [
                            'type' => 'array',
                            'maxItems' => 3,
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'title' => ['type' => 'string'],
                                    'detail' => ['type' => 'string'],
                                ],
                                'required' => ['title'],
                            ],
                        ],
                    ],
                    'required' => ['choices'],
                ],
            ],
        ];
    }

    /** Runs one tool call and returns the JSON string to send back as the tool result. */
    public function run(string $name, array $input): string
    {
        $result = match ($name) {
            'get_balance' => $this->getBalance(),
            'list_goals' => $this->listGoals(),
            'create_goal' => $this->createGoal($input),
            'weeks_to_goal' => $this->weeksToGoal($input),
            'suggest_chores' => $this->suggestChores(),
            'create_purchase_request' => $this->createPurchaseRequest($input),
            'show_choices' => $this->showChoices($input),
            default => throw new InvalidArgumentException("Unknown tool {$name}"),
        };

        return json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function getBalance(): array
    {
        return [
            'balance' => $this->dollars($this->ledger->balance($this->kid)),
            'weekly_allowance' => $this->dollars($this->kid->weekly_allowance),
            'next_allowance' => 'Saturday',
        ];
    }

    public function listGoals(): array
    {
        $balance = $this->ledger->balance($this->kid);

        return $this->kid->goals()->whereNull('completed_at')->get()->map(fn ($goal) => [
            'goal_id' => $goal->id,
            'title' => $goal->title,
            'target' => $this->dollars($goal->target_amount),
            'saved' => $this->dollars(min($balance, $goal->target_amount)),
            'percent_done' => (int) min(100, round($balance / max(1, $goal->target_amount) * 100)),
            'weeks_left' => $this->ledger->weeksToGoal($this->kid, $goal),
        ])->all();
    }

    public function createGoal(array $input): array
    {
        $cents = $this->cents($input['target_amount'] ?? 0);
        $title = trim((string) ($input['title'] ?? ''));

        if ($title === '' || $cents <= 0 || $cents > 100000) {
            return ['error' => 'A goal needs a name and a price between $0.01 and $1,000.'];
        }

        $goal = $this->kid->goals()->create(['title' => mb_substr($title, 0, 60), 'target_amount' => $cents]);

        return ['created' => true, 'goal_id' => $goal->id, 'weeks_left' => $this->ledger->weeksToGoal($this->kid, $goal)];
    }

    public function weeksToGoal(array $input): array
    {
        $balance = $this->ledger->balance($this->kid);

        if (isset($input['price'])) {
            $target = $this->cents($input['price']);
            $title = 'that';
        } else {
            $goal = isset($input['goal_id'])
                ? $this->kid->goals()->find($input['goal_id'])
                : $this->kid->activeGoal;

            if (! $goal) {
                return ['error' => 'No such goal. Call list_goals first.'];
            }

            $target = $goal->target_amount;
            $title = $goal->title;
        }

        $perWeek = $this->kid->weekly_allowance + $this->ledger->weeklyChoreAverage($this->kid);
        $missing = max(0, $target - $balance);
        $weeks = $missing === 0 ? 0 : ($perWeek > 0 ? (int) ceil($missing / $perWeek) : null);
        $withExtraChore = $missing === 0 ? 0 : (int) ceil($missing / ($perWeek + 200));

        return [
            'for' => $title,
            'price' => $this->dollars($target),
            'balance' => $this->dollars($balance),
            'still_needed' => $this->dollars($missing),
            'can_afford_now' => $missing === 0,
            'weeks_left' => $weeks,
            'earning_per_week' => $this->dollars($perWeek),
            'weeks_left_with_one_extra_2_dollar_chore_a_week' => $withExtraChore,
        ];
    }

    public function suggestChores(): array
    {
        return $this->kid->chores()->where('status', 'todo')->get()->map(fn ($chore) => [
            'title' => $chore->title,
            'reward' => $this->dollars($chore->reward),
        ])->all();
    }

    public function createPurchaseRequest(array $input): array
    {
        try {
            $request = $this->requests->create(
                $this->kid,
                (string) ($input['item'] ?? ''),
                $this->cents($input['amount'] ?? 0),
                (string) ($input['reason'] ?? ''),
            );
        } catch (InvalidArgumentException $e) {
            return ['error' => $e->getMessage()];
        }

        $this->createdRequestId = $request->id;

        return ['sent' => true, 'to' => $this->kid->parent->name, 'status' => 'waiting for a grown-up to say yes'];
    }

    public function showChoices(array $input): array
    {
        $this->choices = collect($input['choices'] ?? [])
            ->take(3)
            ->map(fn ($c) => [
                'title' => mb_substr((string) ($c['title'] ?? ''), 0, 40),
                'detail' => isset($c['detail']) ? mb_substr((string) $c['detail'], 0, 80) : null,
            ])
            ->filter(fn ($c) => $c['title'] !== '')
            ->values()
            ->all();

        return ['shown' => count($this->choices)];
    }

    private function dollars(int $cents): float
    {
        return round($cents / 100, 2);
    }

    private function cents(mixed $dollars): int
    {
        return (int) round(((float) $dollars) * 100);
    }
}
