<?php

namespace App\Http\Controllers\Kid;

use App\Http\Controllers\Controller;
use App\Models\Chore;
use App\Models\Kid;
use App\Services\LedgerService;
use App\Services\PurchaseRequestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class KidController extends Controller
{
    public function __construct(private LedgerService $ledger) {}

    public function home(Request $request): Response
    {
        $kid = $this->kid($request);

        return Inertia::render('kid/home', [
            'kid' => $this->ledger->summary($kid),
            'choresToDo' => $kid->chores()->where('status', 'todo')->count(),
            'request' => $this->openRequest($kid),
            'recent' => $kid->transactions()->latest()->take(4)->get(['id', 'type', 'amount', 'note', 'created_at']),
        ]);
    }

    public function goal(Request $request): Response
    {
        $kid = $this->kid($request);

        return Inertia::render('kid/goal', [
            'kid' => $this->ledger->summary($kid),
            'choreAverage' => $this->ledger->weeklyChoreAverage($kid),
            'openChores' => $kid->chores()->where('status', 'todo')->count(),
            'request' => $this->openRequest($kid),
        ]);
    }

    public function storeGoal(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:60'],
            'target' => ['required', 'numeric', 'min:1', 'max:1000'],
        ]);

        $kid = $this->kid($request);
        $kid->goals()->whereNull('completed_at')->delete();
        $kid->goals()->create(['title' => $data['title'], 'target_amount' => (int) round($data['target'] * 100)]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'New goal planted!']);

        return redirect('/kid/goal');
    }

    public function chores(Request $request): Response
    {
        $kid = $this->kid($request);

        return Inertia::render('kid/chores', [
            'kid' => $this->ledger->summary($kid),
            'chores' => $kid->chores()
                ->where(fn ($q) => $q->whereIn('status', ['todo', 'done'])
                    ->orWhere('approved_at', '>=', now()->subWeek()))
                ->orderByRaw("case status when 'todo' then 0 when 'done' then 1 else 2 end")
                ->latest('updated_at')
                ->get(['id', 'title', 'reward', 'status']),
        ]);
    }

    public function finishChore(Request $request, Chore $chore): RedirectResponse
    {
        abort_unless($chore->kid_id === $this->kid($request)->id && $chore->status === 'todo', 403);

        $chore->update(['status' => 'done', 'done_at' => now()]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Nice work! A grown-up will check it.']);

        return back();
    }

    public function goalReached(Request $request): Response|RedirectResponse
    {
        $kid = $this->kid($request);
        $summary = $this->ledger->summary($kid);

        if (! ($summary['goal']['reached'] ?? false)) {
            return redirect('/kid/goal');
        }

        return Inertia::render('kid/goal-reached', [
            'kid' => $summary,
            'parentName' => $kid->parent->name,
            'request' => $this->openRequest($kid),
        ]);
    }

    public function storeRequest(Request $request, PurchaseRequestService $requests): RedirectResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:300']]);
        $kid = $this->kid($request);
        $goal = $kid->activeGoal;

        abort_unless($goal, 404);

        try {
            $requests->create($kid, $goal->title, $goal->target_amount, $data['reason'] ?? "I saved up for my {$goal->title}.");
        } catch (InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "Sent to {$kid->parent->name}!"]);

        return redirect('/kid');
    }

    private function openRequest(Kid $kid): ?array
    {
        $r = $kid->purchaseRequests()->whereIn('status', ['pending', 'approved'])->latest()->first()
            ?? $kid->purchaseRequests()->whereIn('status', ['paid', 'rejected'])->where('decided_at', '>=', now()->subDay())->latest('decided_at')->first();

        return $r ? ['id' => $r->id, 'item' => $r->item, 'amount' => $r->amount, 'status' => $r->status] : null;
    }

    private function kid(Request $request): Kid
    {
        return $request->attributes->get('kid');
    }
}
