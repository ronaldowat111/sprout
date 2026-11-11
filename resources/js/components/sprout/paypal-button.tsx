import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type PayPalConfig = { configured: boolean; clientId: string | null; currency: string; canSimulate: boolean };

type PayPalButtons = { render: (el: HTMLElement) => Promise<void>; close?: () => void };
type PayPalNamespace = {
    Buttons: (options: {
        style?: Record<string, string | number>;
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onCancel?: () => void;
        onError?: (err: unknown) => void;
    }) => PayPalButtons;
};

declare global {
    interface Window {
        paypal?: PayPalNamespace;
    }
}

let sdkPromise: Promise<PayPalNamespace> | null = null;

function loadSdk(clientId: string, currency: string): Promise<PayPalNamespace> {
    sdkPromise ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${currency}&intent=capture&components=buttons`;
        script.async = true;
        script.onload = () => (window.paypal ? resolve(window.paypal) : reject(new Error('PayPal did not load')));
        script.onerror = () => {
            sdkPromise = null;
            reject(new Error('PayPal did not load'));
        };
        document.head.appendChild(script);
    });

    return sdkPromise;
}

function xsrf(): string {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : '';
}

async function post(url: string, body: object = {}): Promise<Record<string, string>> {
    const res = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': xsrf() },
        body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(json.message ?? 'Something went wrong.');
    }

    return json;
}

/**
 * Real money moves here: the parent pays an approved purchase with PayPal.
 * The server creates the order and only writes the ledger after capture.
 */
export function PayPalPay({ requestId, kidName, paypal }: { requestId: number; kidName: string; paypal: PayPalConfig }) {
    const container = useRef<HTMLDivElement>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
    const [busy, setBusy] = useState(false);

    const paid = () => {
        toast.success(`Paid with PayPal. ${kidName}'s balance is updated.`);
        router.reload();
    };

    useEffect(() => {
        if (!paypal.configured || !paypal.clientId || !container.current) {
            return;
        }

        let buttons: PayPalButtons | null = null;
        let cancelled = false;

        loadSdk(paypal.clientId, paypal.currency)
            .then((sdk) => {
                if (cancelled || !container.current) {
                    return;
                }

                buttons = sdk.Buttons({
                    style: { layout: 'horizontal', shape: 'pill', label: 'pay', height: 48, tagline: 'false' },
                    createOrder: async () => (await post(`/paypal/requests/${requestId}/order`)).id,
                    onApprove: async ({ orderID }) => {
                        await post(`/paypal/requests/${requestId}/capture`, { orderID });
                        paid();
                    },
                    onError: (err) => toast.error(err instanceof Error ? err.message : 'PayPal payment failed.'),
                });

                return buttons.render(container.current).then(() => setState('ready'));
            })
            .catch(() => setState('error'));

        return () => {
            cancelled = true;
            buttons?.close?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestId, paypal.configured, paypal.clientId]);

    if (!paypal.configured) {
        return paypal.canSimulate ? (
            <button
                type="button"
                disabled={busy}
                onClick={async () => {
                    setBusy(true);
                    try {
                        await post(`/paypal/requests/${requestId}/simulate`);
                        paid();
                    } catch (e) {
                        toast.error((e as Error).message);
                        setBusy(false);
                    }
                }}
                className="press min-h-11 w-full rounded-full border-[3px] border-ink bg-[#FFC439] p-3 font-extrabold"
            >
                Simulate PayPal payment
                <span className="block text-xs font-semibold">Sandbox keys not set</span>
            </button>
        ) : (
            <p className="text-sm font-semibold">PayPal is not set up yet.</p>
        );
    }

    return (
        <div>
            {state === 'loading' && <div className="h-12 animate-pulse rounded-full bg-line" aria-label="Loading PayPal" />}
            {state === 'error' && <p className="text-sm font-semibold">PayPal couldn&apos;t load. Check your connection and refresh.</p>}
            <div ref={container} className="min-h-12" />
        </div>
    );
}
