<?php

namespace App\Services;

use App\Models\Chore;
use App\Models\Goal;
use App\Models\Kid;
use App\Models\PurchaseRequest;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * The only place that writes to the ledger. A kid's balance is never stored:
 * it is always the sum of their transactions, so it cannot drift out of sync.
 */
class LedgerService
{
    public function balance(Kid $kid): int
    {
        return (int) $kid->transactions()->sum('amount');
    }

    /** Lifetime money in (allowance + chores). Drives Sprout's level. */
    public function earned(Kid $kid): int
    {
        return (int) $kid->transactions()->where('amount', '>', 0)->sum('amount');
    }

    /** One level per $10 earned, capped at 5 (the mascot's last growth stage). */
    public function level(Kid $kid): int
    {
        return min(5, 1 + intdiv($this->earned($kid), 1000));
    }

    /** Average chore money per week over the last four weeks, in cents. */
    public function weeklyChoreAverage(Kid $kid): int
    {
        $sum = (int) $kid->transactions()
            ->where('type', 'chore')
            ->where('created_at', '>=', now()->subWeeks(4))
            ->sum('amount');

        return intdiv($sum, 4);
    }

    /**
     * Weeks until the goal is affordable from allowance + average chores.
     * 0 means it is affordable now; null means there is no income to project from.
     */
    public function weeksToGoal(Kid $kid, Goal $goal): ?int
    {
        $missing = $goal->target_amount - $this->balance($kid);

        if ($missing <= 0) {
            return 0;
        }

        $perWeek = $kid->weekly_allowance + $this->weeklyChoreAverage($kid);

        return $perWeek > 0 ? (int) ceil($missing / $perWeek) : null;
    }

    /** The kid as every screen needs them: money, level and current goal. */
    public function summary(Kid $kid): array
    {
        $balance = $this->balance($kid);
        $goal = $kid->activeGoal;

        return [
            'id' => $kid->id,
            'name' => $kid->name,
            'avatar' => $kid->avatar,
            'balance' => $balance,
            'level' => $this->level($kid),
            'weeklyAllowance' => $kid->weekly_allowance,
            'goal' => $goal ? [
                'id' => $goal->id,
                'title' => $goal->title,
                'target' => $goal->target_amount,
                'saved' => min($balance, $goal->target_amount),
                'progress' => $goal->target_amount > 0
                    ? (int) min(100, max(0, round($balance / $goal->target_amount * 100)))
                    : 0,
                'weeksLeft' => $this->weeksToGoal($kid, $goal),
                'reached' => $balance >= $goal->target_amount,
            ] : null,
        ];
    }

    public function giveAllowance(Kid $kid): Transaction
    {
        return $kid->transactions()->create([
            'type' => 'allowance',
            'amount' => $kid->weekly_allowance,
            'note' => 'Weekly allowance',
        ]);
    }

    public function approveChore(Chore $chore): Transaction
    {
        if ($chore->status !== 'done') {
            throw new RuntimeException('Only a finished chore can be approved.');
        }

        return DB::transaction(function () use ($chore) {
            $chore->update(['status' => 'approved', 'approved_at' => now()]);

            return $chore->kid->transactions()->create([
                'type' => 'chore',
                'amount' => $chore->reward,
                'note' => $chore->title,
            ]);
        });
    }

    /** Called only after PayPal reports the order as COMPLETED. */
    public function recordPurchase(PurchaseRequest $request, string $paypalOrderId): Transaction
    {
        return DB::transaction(function () use ($request, $paypalOrderId) {
            $request->update([
                'status' => 'paid',
                'paypal_order_id' => $paypalOrderId,
                'decided_at' => $request->decided_at ?? now(),
            ]);

            $request->goal?->update(['completed_at' => now()]);

            return $request->kid->transactions()->create([
                'type' => 'purchase',
                'amount' => -$request->amount,
                'note' => $request->item,
            ]);
        });
    }
}
