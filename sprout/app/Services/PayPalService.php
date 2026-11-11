<?php

namespace App\Services;

use App\Models\PurchaseRequest;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/** PayPal Orders v2 (sandbox): OAuth token, create order, capture order. */
class PayPalService
{
    public function configured(): bool
    {
        return filled(config('services.paypal.client_id')) && filled(config('services.paypal.secret'));
    }

    public function clientId(): ?string
    {
        return config('services.paypal.client_id');
    }

    public function createOrder(PurchaseRequest $request): string
    {
        $response = $this->http()->post('/v2/checkout/orders', [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'reference_id' => 'sprout-request-'.$request->id,
                'description' => mb_substr("Sprout: {$request->kid->name} – {$request->item}", 0, 127),
                'amount' => [
                    'currency_code' => config('services.paypal.currency'),
                    'value' => number_format($request->amount / 100, 2, '.', ''),
                ],
            ]],
        ]);

        if ($response->failed()) {
            throw new RuntimeException('PayPal could not create the order: '.$response->json('message', $response->body()));
        }

        return $response->json('id');
    }

    /** @return array{status: string, id: string} */
    public function captureOrder(string $orderId): array
    {
        $response = $this->http()->withBody('{}', 'application/json')->post("/v2/checkout/orders/{$orderId}/capture");

        if ($response->failed()) {
            throw new RuntimeException('PayPal could not capture the order: '.$response->json('message', $response->body()));
        }

        return ['status' => $response->json('status'), 'id' => $response->json('id')];
    }

    private function http(): PendingRequest
    {
        return Http::baseUrl(config('services.paypal.base_url'))
            ->withToken($this->accessToken())
            ->acceptJson()
            ->asJson()
            ->timeout(20);
    }

    private function accessToken(): string
    {
        return Cache::remember('paypal.token', now()->addMinutes(30), function () {
            $response = Http::baseUrl(config('services.paypal.base_url'))
                ->withBasicAuth(config('services.paypal.client_id'), config('services.paypal.secret'))
                ->asForm()
                ->post('/v1/oauth2/token', ['grant_type' => 'client_credentials']);

            if ($response->failed()) {
                throw new RuntimeException('PayPal sign-in failed. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
            }

            return $response->json('access_token');
        });
    }
}
