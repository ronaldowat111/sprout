<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use App\Services\LedgerService;
use App\Services\PayPalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalController extends Controller
{
    public function index(Request $request, LedgerService $ledger, PayPalService $paypal): Response
    {
        $kidIds = $request->user()->kids()->pluck('id');
        $present = function (PurchaseRequest $r) use ($ledger) {
            $balance = $ledger->balance($r->kid);

            return [
                'id' => $r->id,
                'item' => $r->item,
                'amount' => $r->amount,
                'reason' => $r->kid_reason,
                'summary' => $r->ai_summary,
                'status' => $r->status,
                'forGoal' => $r->goal_id !== null,
                'kid' => $r->kid->only('id', 'name', 'avatar'),
                'balance' => $balance,
                'enough' => $balance >= $r->amount,
                'when' => $r->created_at->diffForHumans(),
                'decided' => $r->decided_at?->diffForHumans(),
            ];
        };

        $base = PurchaseRequest::with('kid')->whereIn('kid_id', $kidIds);

        return Inertia::render('parent/approvals', [
            'open' => (clone $base)->whereIn('status', ['pending', 'approved'])->latest()->get()->map($present),
            'done' => (clone $base)->whereIn('status', ['paid', 'rejected'])->latest('decided_at')->take(10)->get()->map($present),
            'paypal' => [
                'configured' => $paypal->configured(),
                'clientId' => $paypal->clientId(),
                'currency' => config('services.paypal.currency'),
                'canSimulate' => ! $paypal->configured() && app()->isLocal(),
            ],
        ]);
    }

    public function reject(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        abort_unless($purchaseRequest->kid->parent_id === $request->user()->id, 404);
        abort_unless(in_array($purchaseRequest->status, ['pending', 'approved'], true), 422);

        $purchaseRequest->update(['status' => 'rejected', 'decided_at' => now()]);
        Inertia::flash('toast', ['type' => 'info', 'message' => "Not now. {$purchaseRequest->kid->name} keeps saving."]);

        return back();
    }
}
