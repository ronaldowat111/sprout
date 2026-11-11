<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\Kid;
use App\Services\LedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class KidController extends Controller
{
    public function __construct(private LedgerService $ledger) {}

    public function create(): Response
    {
        return Inertia::render('parent/kid-create', ['avatars' => Kid::AVATARS]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:30'],
            'avatar' => ['required', Rule::in(Kid::AVATARS)],
            'pin' => ['required', 'digits:4'],
            'allowance' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $kid = new Kid([
            'name' => $data['name'],
            'avatar' => $data['avatar'],
            'weekly_allowance' => (int) round($data['allowance'] * 100),
        ]);
        $kid->setPin($data['pin']);
        $request->user()->kids()->save($kid);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$kid->name} can now sign in with their PIN."]);

        return redirect("/parent/kids/{$kid->id}");
    }

    public function show(Request $request, Kid $kid): Response
    {
        $this->authorizeKid($request, $kid);

        return Inertia::render('parent/kid', [
            'kid' => $this->ledger->summary($kid),
            'history' => $kid->transactions()->latest()->take(30)->get(['id', 'type', 'amount', 'note', 'created_at']),
            'choreAverage' => $this->ledger->weeklyChoreAverage($kid),
        ]);
    }

    public function update(Request $request, Kid $kid): RedirectResponse
    {
        $this->authorizeKid($request, $kid);
        $data = $request->validate(['allowance' => ['required', 'numeric', 'min:0', 'max:100']]);

        $kid->update(['weekly_allowance' => (int) round($data['allowance'] * 100)]);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Allowance saved.']);

        return back();
    }

    public function giveAllowance(Request $request, Kid $kid): RedirectResponse
    {
        $this->authorizeKid($request, $kid);

        $this->ledger->giveAllowance($kid);
        Inertia::flash('toast', ['type' => 'success', 'message' => "Paid {$kid->name}'s allowance: $".number_format($kid->weekly_allowance / 100, 2)]);

        return back();
    }

    private function authorizeKid(Request $request, Kid $kid): void
    {
        abort_unless($kid->parent_id === $request->user()->id, 404);
    }
}
