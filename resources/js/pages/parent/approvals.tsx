import { Head, router } from '@inertiajs/react';
import { BottomNav } from '@/components/sprout/bottom-nav';
import { PayPalPay } from '@/components/sprout/paypal-button';
import { Phone } from '@/components/sprout/phone';
import { KidAvatar, Shield, Sparkle } from '@/components/sprout/ui';
import { money } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { KidRef } from '@/types/sprout';

type Request = {
    id: number;
    item: string;
    amount: number;
    reason: string;
    summary: string | null;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
    forGoal: boolean;
    kid: Required<KidRef>;
    balance: number;
    enough: boolean;
    when: string;
    decided: string | null;
};

type Props = {
    open: Request[];
    done: Request[];
    paypal: { configured: boolean; clientId: string | null; currency: string; canSimulate: boolean };
};

/** P6: purchase requests. Approving means paying with PayPal. */
export default function Approvals({ open, done, paypal }: Props) {
    return (
        <Phone bg="bg-paper" footer={<BottomNav variant="parent" active="approvals" badges={{ approvals: open.length }} />}>
            <Head title="Approvals" />
            <div className="flex flex-col gap-3.5 px-5 pt-6 pb-28">
                <h1 className="font-display text-[28px] leading-tight font-normal [&_b]:font-extrabold">
                    <b>Approve</b> &amp; pay
                </h1>

                {open.length === 0 && (
                    <p className="rounded-[20px] border-[3px] border-dashed border-ink bg-white px-4 py-4 text-sm font-semibold">
                        No requests waiting. When your kid saves up and asks Sprout, the request lands here.
                    </p>
                )}

                {open.map((r) => (
                    <article key={r.id} className="animate-rise overflow-hidden rounded-3xl border-[3px] border-ink bg-white shadow-hard">
                        <div className="flex items-center gap-2.5 border-b-[3px] border-ink bg-pink px-4 py-2">
                            <KidAvatar name={r.kid.name} avatar={r.kid.avatar} size={30} />
                            <div className="text-[13px] font-extrabold tracking-wide">
                                {r.status === 'approved' ? 'PAYMENT STARTED' : 'NEW REQUEST'} · {r.kid.name.toUpperCase()}
                            </div>
                            <div className="ml-auto text-xs font-semibold">{r.when}</div>
                        </div>
                        <div className="flex flex-col gap-2.5 px-4 pt-3.5 pb-4">
                            <div className="flex items-baseline justify-between gap-3">
                                <h2 className="text-[17px] font-extrabold">{r.item}</h2>
                                <div className="font-display text-[26px] font-extrabold">{money(r.amount)}</div>
                            </div>
                            <blockquote className="text-sm leading-snug text-[#333333]">&ldquo;{r.reason}&rdquo;</blockquote>
                            {r.summary && (
                                <div className="flex items-start gap-2 rounded-[14px] bg-sky-50 px-3 py-2.5">
                                    <Sparkle size={18} />
                                    <p className="text-[13px] leading-snug font-medium">
                                        <b>Sprout&apos;s summary:</b> {r.summary}
                                    </p>
                                </div>
                            )}
                            <div className="flex justify-between text-[13px] font-bold">
                                <span>{r.kid.name}&apos;s balance</span>
                                <span>
                                    {money(r.balance)} → {money(r.balance - r.amount)}
                                </span>
                            </div>

                            {r.enough ? (
                                <PayPalPay requestId={r.id} kidName={r.kid.name} paypal={paypal} />
                            ) : (
                                <p className="rounded-[14px] border-2 border-ink bg-sun px-3 py-2 text-[13px] font-bold">
                                    {r.kid.name} doesn&apos;t have enough saved for this any more.
                                </p>
                            )}
                            <button
                                type="button"
                                onClick={() => router.post(`/parent/requests/${r.id}/reject`, {}, { preserveScroll: true })}
                                className="press min-h-11 rounded-full border-[3px] border-ink bg-white p-3 font-extrabold"
                            >
                                Not now
                            </button>
                        </div>
                    </article>
                ))}

                <div className="flex items-start gap-2.5 rounded-[18px] border-[3px] border-dashed border-ink bg-white px-3.5 py-3">
                    <Shield size={20} />
                    <p className="text-[13px] leading-snug font-semibold">
                        Sprout&apos;s AI can only <b>ask</b>. It has no way to spend. Money leaves your PayPal account only when you pay here.
                    </p>
                </div>

                {done.length > 0 && (
                    <section className="rounded-3xl border-[3px] border-ink bg-white px-4 py-2">
                        <h2 className="py-2 font-extrabold">Recent decisions</h2>
                        <ul>
                            {done.map((r) => (
                                <li key={r.id} className="flex items-center gap-3 border-t-2 border-line py-2.5">
                                    <KidAvatar name={r.kid.name} avatar={r.kid.avatar} size={30} />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-bold">{r.item}</div>
                                        <div className="text-xs font-semibold text-ink-muted">{r.decided}</div>
                                    </div>
                                    <span
                                        className={cn(
                                            'rounded-full border-2 border-ink px-2 py-0.5 text-[11px] font-extrabold',
                                            r.status === 'paid' ? 'bg-leaf' : 'bg-white',
                                        )}
                                    >
                                        {r.status === 'paid' ? `Bought · ${money(r.amount)}` : 'Not now'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </Phone>
    );
}
