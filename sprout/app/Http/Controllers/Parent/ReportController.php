<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\Kid;
use App\Services\CoachAgent;
use App\Services\LedgerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

/** Sprout's weekly report. Parents see summaries of chats, never the chats themselves. */
class ReportController extends Controller
{
    public function __invoke(Request $request, LedgerService $ledger, CoachAgent $coach): Response
    {
        $kids = $request->user()->kids()->orderBy('name')->get();
        /** @var Kid|null $kid */
        $kid = $kids->firstWhere('id', (int) $request->query('kid'))
            ?? $kids->sortByDesc(fn (Kid $k) => max(
                (string) $k->chatMessages()->max('created_at'),
                (string) $k->transactions()->max('created_at'),
            ))->first();

        if (! $kid) {
            return Inertia::render('parent/report', ['kids' => [], 'report' => null]);
        }

        $from = now()->subDays(6)->startOfDay();
        $tx = $kid->transactions()->where('created_at', '>=', $from)->get();
        $stats = [
            'from' => $from->format('M j'),
            'to' => now()->format('M j'),
            'allowance' => (int) $tx->where('type', 'allowance')->sum('amount'),
            'chores' => (int) $tx->where('type', 'chore')->sum('amount'),
            'spent' => (int) -$tx->where('type', 'purchase')->sum('amount'),
            'balance' => $ledger->balance($kid),
            'choresDone' => $kid->chores()->where('approved_at', '>=', $from)->count(),
            'requests' => $kid->purchaseRequests()->where('created_at', '>=', $from)->get(['item', 'amount', 'status'])->toArray(),
        ];
        $stats['in'] = $stats['allowance'] + $stats['chores'];
        $stats['saved'] = max(0, $stats['in'] - $stats['spent']);

        $chats = $kid->chatMessages()->where('created_at', '>=', $from)->get(['role', 'content']);
        $cacheKey = sprintf('report:%d:%s:%d:%d', $kid->id, now()->toDateString(), $tx->count(), $chats->count());
        $notes = Cache::remember($cacheKey, now()->addHour(), fn () => $coach->weeklyNotes($kid, $stats, $chats->all()));

        return Inertia::render('parent/report', [
            'kids' => $kids->map->only('id', 'name', 'avatar'),
            'report' => [
                'kid' => $ledger->summary($kid),
                'stats' => $stats,
                'notes' => $notes,
                'chatCount' => $chats->where('role', 'user')->count(),
            ],
        ]);
    }
}
