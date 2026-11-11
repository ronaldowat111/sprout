<?php

namespace App\Services;

use App\Models\Kid;

/**
 * A small rule-based stand-in for the AI coach, used when no Anthropic key is
 * set or the API is unreachable. It uses the same tools, so the numbers and
 * the purchase-request gate behave exactly like the real coach.
 */
class OfflineCoach
{
    public function __construct(
        private Kid $kid,
        private LedgerService $ledger,
        private CoachTools $tools,
    ) {}

    public function reply(string $text): string
    {
        $t = mb_strtolower($text);
        $goal = $this->kid->activeGoal;
        $balance = $this->ledger->balance($this->kid);

        if (preg_match('/\b(send|ask (mom|mum|dad|my parent|a grown)|request|yes,? please)\b/', $t) && $goal && $balance >= $goal->target_amount) {
            $result = $this->tools->createPurchaseRequest([
                'item' => $goal->title,
                'amount' => $goal->target_amount / 100,
                'reason' => "I saved up for my {$goal->title}.",
            ]);

            return isset($result['sent'])
                ? "Done! I sent your {$goal->title} request to {$result['to']}. Now a grown-up decides. Great saving!"
                : $result['error'];
        }

        if (preg_match('/\$?\s*(\d+(?:\.\d{1,2})?)/', $t, $m) && (float) $m[1] > 0) {
            $w = $this->tools->weeksToGoal(['price' => (float) $m[1]]);
            if ($w['can_afford_now']) {
                $price = (int) round((float) $m[1] * 100);
                $perWeek = max(1, $this->kid->weekly_allowance + $this->ledger->weeklyChoreAverage($this->kid));
                $delay = $goal ? (int) ceil(min($price, $balance) / $perWeek) : 0;

                $this->tools->showChoices(['choices' => [
                    ['title' => 'I\'ll keep saving', 'detail' => $goal ? "{$goal->title} stays on track" : 'Keep the money'],
                    ['title' => 'Is it worth it?', 'detail' => 'Think about need vs want'],
                    ['title' => 'Ask a grown-up', 'detail' => 'They decide and pay'],
                ]]);

                $cost = $goal && $delay > 0 ? " But your {$goal->title} would be about {$delay} week".($delay === 1 ? '' : 's').' later.' : '';

                return "You have \${$this->fmt($w['balance'])}, so you could afford it.{$cost} Is it a need or a want?";
            }

            $this->tools->showChoices(['choices' => [
                ['title' => 'I\'ll wait and save', 'detail' => "About {$w['weeks_left']} weeks"],
                ['title' => 'How can I save faster?', 'detail' => 'Chores can help'],
                ['title' => 'Is it worth it?', 'detail' => 'Need vs want'],
            ]]);

            return "That costs \${$this->fmt($w['price'])}. You have \${$this->fmt($w['balance'])}, so you're \${$this->fmt($w['still_needed'])} short. Saving \${$this->fmt($w['earning_per_week'])} a week, that's about {$w['weeks_left']} weeks.";
        }

        if (preg_match('/faster|chore|earn|more money/', $t)) {
            $chores = $this->tools->suggestChores();
            if ($chores === []) {
                return 'No chores are posted right now. You could ask a grown-up if there is a job you can help with!';
            }
            $list = collect($chores)->map(fn ($c) => "{$c['title']} (\${$this->fmt($c['reward'])})")->join(', ', ' or ');

            return "You could do {$list}. Every chore gets you closer to your goal!";
        }

        if (preg_match('/worth|need|want/', $t)) {
            return 'Good question! A need is something you must have, like shoes that fit. A want is something fun to have. Wants are okay, but waiting a few days helps you know if you really want it.';
        }

        if ($goal) {
            $w = $this->tools->weeksToGoal(['goal_id' => $goal->id]);
            if ($w['can_afford_now']) {
                $this->tools->showChoices(['choices' => [
                    ['title' => 'Yes, send it', 'detail' => 'A grown-up decides'],
                    ['title' => 'Not yet', 'detail' => 'Keep the money saved'],
                ]]);

                return "You did it! You saved \${$this->fmt($w['balance'])} for your {$goal->title}. Want me to send a request to a grown-up?";
            }

            return "You have \${$this->fmt($w['balance'])} saved for your {$goal->title}. Only \${$this->fmt($w['still_needed'])} to go, about {$w['weeks_left']} more weeks!";
        }

        return 'Hi! I\'m Sprout. Tell me something you want to save for and how much it costs.';
    }

    private function fmt(float $dollars): string
    {
        return fmod($dollars, 1.0) === 0.0 ? (string) (int) $dollars : number_format($dollars, 2);
    }
}
