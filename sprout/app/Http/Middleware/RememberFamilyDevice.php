<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

/**
 * Once a parent has signed in on a device, remember the family there so their
 * kids can pick their name and enter a PIN without the parent's password.
 */
class RememberFamilyDevice
{
    public const COOKIE = 'sprout_family';

    public function handle(Request $request, Closure $next): Response
    {
        if ($user = $request->user()) {
            Cookie::queue(self::COOKIE, (string) $user->id, 60 * 24 * 365);
        }

        return $next($request);
    }
}
