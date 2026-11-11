<?php

namespace App\Http\Controllers\Kid;

use App\Http\Controllers\Controller;
use App\Http\Middleware\RememberFamilyDevice;
use App\Models\Kid;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class KidAuthController extends Controller
{
    public function show(Request $request): Response
    {
        $familyId = $this->familyId($request);
        $kids = $familyId
            ? Kid::where('parent_id', $familyId)->orderBy('name')->get(['id', 'name', 'avatar'])
            : collect();

        return Inertia::render('kid/login', [
            'kids' => $kids,
            'paired' => $familyId !== null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'kid_id' => ['required', 'integer'],
            'pin' => ['required', 'digits:4'],
        ]);

        $key = 'kid-pin:'.$data['kid_id'].'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages(['pin' => 'Too many tries. Wait a minute and try again.']);
        }

        $kid = Kid::where('parent_id', $this->familyId($request))->find($data['kid_id']);

        if (! $kid || ! $kid->checkPin($data['pin'])) {
            RateLimiter::hit($key, 60);
            throw ValidationException::withMessages(['pin' => "That PIN doesn't match. Try again!"]);
        }

        RateLimiter::clear($key);
        $request->session()->put('kid_id', $kid->id);

        return redirect('/kid');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->session()->forget('kid_id');

        return redirect('/kid/login');
    }

    private function familyId(Request $request): ?int
    {
        $id = $request->user()?->id ?? $request->cookie(RememberFamilyDevice::COOKIE);

        return $id ? (int) $id : null;
    }
}
