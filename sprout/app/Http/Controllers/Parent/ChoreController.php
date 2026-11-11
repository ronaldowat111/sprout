<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\Chore;
use App\Services\LedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ChoreController extends Controller
{
    public function index(Request $request, LedgerService $ledger): Response
    {
        $kids = $request->user()->kids()->with('activeGoal')->orderBy('name')->get();
        $chores = Chore::with('kid:id,name,avatar')
            ->whereIn('kid_id', $kids->pluck('id'))
            ->latest('updated_at')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'reward' => $c->reward,
                'status' => $c->status,
                'kid' => $c->kid->only('id', 'name', 'avatar'),
                'when' => ($c->status === 'approved' ? $c->approved_at : ($c->done_at ?? $c->created_at))?->diffForHumans(),
            ]);

        // Sprout's tip: nudge toward the kid who is closest to (but short of) their goal.
        $tip = $kids->map(fn ($k) => $ledger->summary($k))
            ->filter(fn ($s) => $s['goal'] && ! $s['goal']['reached'])
            ->sortBy(fn ($s) => $s['goal']['target'] - $s['goal']['saved'])
            ->first();

        return Inertia::render('parent/chores', [
            'kids' => $kids->map->only('id', 'name', 'avatar'),
            'chores' => $chores,
            'tip' => $tip ? [
                'name' => $tip['name'],
                'goal' => $tip['goal']['title'],
                'missing' => $tip['goal']['target'] - $tip['goal']['saved'],
            ] : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $kidIds = $request->user()->kids()->pluck('id')->all();
        $data = $request->validate([
            'kid_id' => ['required', Rule::in($kidIds)],
            'title' => ['required', 'string', 'max:60'],
            'reward' => ['required', 'numeric', 'min:0.25', 'max:50'],
        ]);

        Chore::forceCreate([
            'kid_id' => $data['kid_id'],
            'title' => $data['title'],
            'reward' => (int) round($data['reward'] * 100),
            'status' => 'todo',
        ]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Chore posted.']);

        return back();
    }

    public function approve(Request $request, Chore $chore, LedgerService $ledger): RedirectResponse
    {
        $this->authorizeChore($request, $chore);
        abort_unless($chore->status === 'done', 422);

        $ledger->approveChore($chore);
        Inertia::flash('toast', ['type' => 'success', 'message' => "Paid {$chore->kid->name} $".number_format($chore->reward / 100, 2)]);

        return back();
    }

    public function redo(Request $request, Chore $chore): RedirectResponse
    {
        $this->authorizeChore($request, $chore);
        abort_unless($chore->status === 'done', 422);

        $chore->update(['status' => 'todo', 'done_at' => null]);
        Inertia::flash('toast', ['type' => 'info', 'message' => "Asked {$chore->kid->name} to have another go."]);

        return back();
    }

    public function destroy(Request $request, Chore $chore): RedirectResponse
    {
        $this->authorizeChore($request, $chore);
        abort_if($chore->status === 'approved', 422);

        $chore->delete();

        return back();
    }

    private function authorizeChore(Request $request, Chore $chore): void
    {
        abort_unless($chore->kid->parent_id === $request->user()->id, 404);
    }
}
