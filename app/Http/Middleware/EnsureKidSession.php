<?php

namespace App\Http\Middleware;

use App\Models\Kid;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Kids never get a user account: they sign in with a PIN under their
 * parent's account, which puts their kid id in the session.
 */
class EnsureKidSession
{
    public function handle(Request $request, Closure $next): Response
    {
        $kid = Kid::find($request->session()->get('kid_id'));

        if (! $kid) {
            $request->session()->forget('kid_id');

            return redirect('/kid/login');
        }

        $request->attributes->set('kid', $kid);

        return $next($request);
    }
}
