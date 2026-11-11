<?php

namespace App\Services;

use App\Models\Kid;
use App\Models\PurchaseRequest;
use InvalidArgumentException;

/** Creating a purchase request, shared by the coach tool and the kid's "Ask a grown-up" button. */
class PurchaseRequestService
{
    public function __construct(
        private LedgerService $ledger,
        private CoachAgent $coach,
    ) {}

    public function create(Kid $kid, string $item, int $amount, string $reason): PurchaseRequest
    {
        $item = trim($item);
        $reason = trim($reason);

        if ($item === '' || $amount <= 0) {
            throw new InvalidArgumentException('A request needs an item and a price.');
        }

        $balance = $this->ledger->balance($kid);
        if ($amount > $balance) {
            $short = number_format(($amount - $balance) / 100, 2);
            throw new InvalidArgumentException("Not enough saved yet: still \${$short} short. Keep saving first.");
        }

        if ($kid->purchaseRequests()->whereIn('status', ['pending', 'approved'])->where('item', $item)->exists()) {
            throw new InvalidArgumentException('There is already a request waiting for this item.');
        }

        $goal = $kid->activeGoal;
        $matchesGoal = $goal && str_contains(mb_strtolower($item), mb_strtolower($goal->title));

        $request = $kid->purchaseRequests()->create([
            'goal_id' => $matchesGoal ? $goal->id : null,
            'item' => mb_substr($item, 0, 80),
            'amount' => $amount,
            'kid_reason' => $reason !== '' ? mb_substr($reason, 0, 500) : 'No reason given.',
        ]);

        $request->update(['ai_summary' => $this->coach->summarizeRequest($request)]);

        return $request;
    }
}
