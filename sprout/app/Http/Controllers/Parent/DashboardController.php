<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\Chore;
use App\Models\PurchaseRequest;
use App\Services\LedgerService;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, LedgerService $ledger, PayPalService $paypal): Response
    {
        $parent = $request->user();
        $kids = $parent->kids()->with('activeGoal')->orderBy('name')->get();
        $kidIds = $kids->pluck('id');

        $requests = PurchaseRequest::with('kid:id,name,avatar')
            ->whereIn('kid_id', $kidIds)
            ->whereIn('status', ['pending', 'approved'])
            ->latest()
            ->get()
            ->map(fn ($r) => [
                'kind' => 'request',
                'id' => $r->id,
                'kid' => $r->kid->only('name', 'avatar'),
                'title' => "{$r->kid->name} asks for {$r->item}",
                'detail' => 'Purchase request · '.$r->created_at->diffForHumans(),
                'amount' => $r->amount,
                'href' => '/parent/approvals',
            ]);

        $chores = Chore::with('kid:id,name,avatar')
            ->whereIn('kid_id', $kidIds)
            ->where('status', 'done')
            ->latest('done_at')
            ->get()
            ->map(fn ($c) => [
                'kind' => 'chore',
                'id' => $c->id,
                'kid' => $c->kid->only('name', 'avatar'),
                'title' => "{$c->kid->name} finished \"{$c->title}\"",
                'detail' => 'Chore to check · pays $'.number_format($c->reward / 100, 2),
                'amount' => $c->reward,
                'href' => '/parent/chores',
            ]);

        $summaries = $kids->map(fn ($kid) => $ledger->summary($kid));

        return Inertia::render('parent/dashboard', [
            'parentName' => $parent->name,
            'kids' => $summaries,
            'totalSaved' => $summaries->sum('balance'),
            'needsYou' => $requests->concat($chores)->values(),
            'paypalReady' => $paypal->configured(),
        ]);
    }
}
