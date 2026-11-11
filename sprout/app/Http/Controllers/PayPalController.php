<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequest;
use App\Services\LedgerService;
use App\Services\PayPalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * The moment real money moves: a parent pays for an approved purchase
 * request through PayPal. The ledger is only written after PayPal reports
 * the capture as COMPLETED.
 */
class PayPalController extends Controller
{
    public function __construct(private PayPalService $paypal, private LedgerService $ledger) {}

    public function createOrder(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorizeOpen($request, $purchaseRequest);

        if ($this->ledger->balance($purchaseRequest->kid) < $purchaseRequest->amount) {
            return response()->json(['message' => "{$purchaseRequest->kid->name} doesn't have enough saved for this any more."], 422);
        }

        try {
            $orderId = $this->paypal->createOrder($purchaseRequest);
        } catch (Throwable $e) {
            Log::error('PayPal create order failed', ['error' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 502);
        }

        $purchaseRequest->update(['status' => 'approved', 'paypal_order_id' => $orderId, 'decided_at' => now()]);

        return response()->json(['id' => $orderId]);
    }

    public function capture(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        $this->authorizeOpen($request, $purchaseRequest);
        $orderId = (string) $request->input('orderID');

        abort_unless($orderId !== '' && $orderId === $purchaseRequest->paypal_order_id, 422, 'Order does not match this request.');

        try {
            $result = $this->paypal->captureOrder($orderId);
        } catch (Throwable $e) {
            Log::error('PayPal capture failed', ['error' => $e->getMessage()]);

            return response()->json(['message' => $e->getMessage()], 502);
        }

        if ($result['status'] !== 'COMPLETED') {
            return response()->json(['message' => "PayPal says the payment is {$result['status']}."], 409);
        }

        $this->ledger->recordPurchase($purchaseRequest, $orderId);

        return response()->json(['status' => 'paid']);
    }

    /** Local demo only, when no sandbox keys are set: pretends PayPal completed. */
    public function simulate(Request $request, PurchaseRequest $purchaseRequest): JsonResponse
    {
        abort_if($this->paypal->configured() || ! app()->isLocal(), 404);
        $this->authorizeOpen($request, $purchaseRequest);

        if ($this->ledger->balance($purchaseRequest->kid) < $purchaseRequest->amount) {
            return response()->json(['message' => "{$purchaseRequest->kid->name} doesn't have enough saved for this any more."], 422);
        }

        $this->ledger->recordPurchase($purchaseRequest, 'SIMULATED-'.Str::upper(Str::random(10)));

        return response()->json(['status' => 'paid']);
    }

    private function authorizeOpen(Request $request, PurchaseRequest $purchaseRequest): void
    {
        abort_unless($purchaseRequest->kid->parent_id === $request->user()->id, 404);
        abort_unless(in_array($purchaseRequest->status, ['pending', 'approved'], true), 422, 'This request is already closed.');
    }
}
