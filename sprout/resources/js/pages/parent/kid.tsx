import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { BottomNav } from '@/components/sprout/bottom-nav';
import { Phone } from '@/components/sprout/phone';
import { BackLink, KidAvatar, ProgressBar } from '@/components/sprout/ui';
import { money } from '@/lib/money';
import type { KidSummary, Transaction } from '@/types/sprout';

type Props = { kid: KidSummary; history: Transaction[]; choreAverage: number };

const typeLabel: Record<Transaction['type'], string> = {
    allowance: 'Allowance',
    chore: 'Chore',
    purchase: 'Purchase',
};

export default function ParentKid({ kid, history }: Props) {
    const form = useForm({ allowance: kid.weeklyAllowance / 100 });
    const step = (d: number) => form.setData('allowance', Math.max(0, Math.min(100, form.data.allowance + d)));
    const changed = Math.round(form.data.allowance * 100) !== kid.weeklyAllowance;

    const save = (e: FormEvent) => {
        e.preventDefault();
        form.patch(`/parent/kids/${kid.id}`, { preserveScroll: true });
    };

    return (
        <Phone bg="bg-paper" footer={<BottomNav variant="parent" active="home" />}>
            <Head title={`${kid.name}'s wallet`} />
            <div className="flex flex-col gap-3.5 px-5 pt-6 pb-28">
                <div className="flex items-center gap-3">
                    <BackLink href="/dashboard" />
                    <div className="flex-1">
                        <div className="text-[13px] font-bold text-ink-muted">
                            Level {kid.level}
                            {kid.goal ? ` · ${kid.goal.title} ${kid.goal.progress}%` : ''}
                        </div>
                        <h1 className="font-display text-[26px] leading-tight font-extrabold">{kid.name}&apos;s wallet</h1>
                    </div>
                    <KidAvatar name={kid.name} avatar={kid.avatar} />
                </div>

                <div className="rounded-3xl border-[3px] border-ink bg-white p-4 shadow-hard">
                    <div className="text-[13px] font-bold text-ink-muted">Balance (virtual credit)</div>
                    <div className="font-display text-[40px] leading-tight font-extrabold tracking-tight">{money(kid.balance)}</div>
                    {kid.goal && (
                        <>
                            <div className="mt-2 flex justify-between text-sm font-extrabold">
                                <span>{kid.goal.title}</span>
                                <span>
                                    {money(kid.goal.saved, { whole: true })} / {money(kid.goal.target, { whole: true })}
                                </span>
                            </div>
                            <ProgressBar value={kid.goal.progress} label={`${kid.goal.progress} percent saved`} className="mt-1.5" />
                            <div className="mt-1.5 text-xs font-semibold text-ink-muted">
                                {kid.goal.reached
                                    ? 'Goal reached. Watch for a purchase request.'
                                    : kid.goal.weeksLeft !== null
                                      ? `About ${kid.goal.weeksLeft} week${kid.goal.weeksLeft === 1 ? '' : 's'} to go`
                                      : 'No income yet'}
                            </div>
                        </>
                    )}
                </div>

                <form onSubmit={save} className="rounded-3xl border-[3px] border-ink bg-white p-4">
                    <div className="flex items-center justify-between">
                        <div className="font-extrabold">Weekly allowance</div>
                        <div className="rounded-full border-2 border-ink bg-sky-50 px-2.5 py-1 text-xs font-extrabold">Every Saturday</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <button
                            type="button"
                            aria-label="Decrease allowance"
                            onClick={() => step(-1)}
                            className="press size-11 rounded-full border-[3px] border-ink bg-white text-2xl font-extrabold"
                        >
                            −
                        </button>
                        <div className="font-display text-[44px] font-extrabold tracking-tight" aria-live="polite">
                            ${form.data.allowance}
                        </div>
                        <button
                            type="button"
                            aria-label="Increase allowance"
                            onClick={() => step(1)}
                            className="press size-11 rounded-full border-[3px] border-ink bg-ink text-2xl font-extrabold text-white"
                        >
                            +
                        </button>
                    </div>
                    <div className="mt-3 flex gap-2.5">
                        <button
                            type="submit"
                            disabled={!changed || form.processing}
                            className="press min-h-11 flex-1 rounded-full border-[3px] border-ink bg-white p-3 font-extrabold disabled:opacity-40"
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            onClick={() => router.post(`/parent/kids/${kid.id}/allowance`, {}, { preserveScroll: true })}
                            className="press min-h-11 flex-1 rounded-full border-[3px] border-ink bg-ink p-3 font-extrabold text-white"
                        >
                            Give {money(kid.weeklyAllowance, { whole: true })} now
                        </button>
                    </div>
                </form>

                <section className="rounded-3xl border-[3px] border-ink bg-white px-4 py-2">
                    <h2 className="py-2 font-extrabold">History</h2>
                    {history.length === 0 && <p className="pb-3 text-sm font-semibold text-ink-muted">Nothing yet.</p>}
                    <ul>
                        {history.map((t) => (
                            <li key={t.id} className="flex items-center justify-between border-t-2 border-line py-2.5">
                                <div>
                                    <div className="text-sm font-bold">{t.note ?? typeLabel[t.type]}</div>
                                    <div className="text-xs font-semibold text-ink-muted">
                                        {typeLabel[t.type]} · {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                                <div className="font-extrabold">{t.amount > 0 ? `+${money(t.amount)}` : money(t.amount)}</div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </Phone>
    );
}
