<?php

namespace App\Http\Controllers\Kid;

use App\Http\Controllers\Controller;
use App\Models\Kid;
use App\Services\CoachAgent;
use App\Services\LedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CoachController extends Controller
{
    public function show(Request $request, LedgerService $ledger, CoachAgent $coach): Response
    {
        /** @var Kid $kid */
        $kid = $request->attributes->get('kid');

        return Inertia::render('kid/coach', [
            'kid' => $ledger->summary($kid),
            'messages' => $kid->chatMessages()->latest('id')->take(40)->get(['id', 'role', 'content', 'choices'])->reverse()->values(),
            'aiEnabled' => $coach->enabled(),
            'prefill' => $request->query('ask'),
        ]);
    }

    public function store(Request $request, CoachAgent $coach): RedirectResponse
    {
        $data = $request->validate(['message' => ['required', 'string', 'max:300']]);

        /** @var Kid $kid */
        $kid = $request->attributes->get('kid');
        $result = $coach->reply($kid, trim($data['message']));

        if ($result['requestCreated']) {
            Inertia::flash('toast', ['type' => 'success', 'message' => "Request sent to {$kid->parent->name}!"]);
        }

        return redirect('/kid/coach');
    }

    public function reset(Request $request): RedirectResponse
    {
        $request->attributes->get('kid')->chatMessages()->delete();

        return redirect('/kid/coach');
    }
}
