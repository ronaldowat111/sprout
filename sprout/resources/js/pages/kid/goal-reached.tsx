import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Mascot } from '@/components/sprout/mascot';
import { Phone } from '@/components/sprout/phone';
import { money } from '@/lib/money';
import type { KidSummary, OpenRequest } from '@/types/sprout';

type Props = { kid: KidSummary; parentName: string; request: OpenRequest | null };

/** K5: full-bleed celebration when the goal is reached, then ask a grown-up. */
export default function GoalReached({ kid, parentName, request }: Props) {
    const goal = kid.goal!;
    const form = useForm({ reason: '' });
    const waiting = request && (request.status === 'pending' || request.status === 'approved');

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/kid/requests');
    };

    return (
        <Phone bg="bg-grass">
            <Head title="Goal reached" />
            <svg width="390" height="460" viewBox="0 0 390 460" className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2" aria-hidden="true">
                <g fill="#7FE08B">
                    <path d="M195 290 L120 0 L170 0 Z" />
                    <path d="M195 290 L220 0 L270 0 Z" />
                    <path d="M195 290 L320 0 L390 0 L390 30 Z" />
                    <path d="M195 290 L0 40 L0 0 L60 0 Z" />
                    <path d="M195 290 L390 160 L390 220 Z" />
                    <path d="M195 290 L0 170 L0 230 Z" />
                </g>
                <rect x="58" y="96" width="14" height="14" rx="3" fill="#FFC93C" stroke="#141414" strokeWidth="2.5" transform="rotate(20 65 103)" />
                <rect x="318" y="120" width="12" height="12" rx="3" fill="#FF8FB1" stroke="#141414" strokeWidth="2.5" transform="rotate(-15 324 126)" />
                <circle cx="300" cy="300" r="7" fill="#8EC5FF" stroke="#141414" strokeWidth="2.5" />
                <circle cx="86" cy="330" r="6" fill="#FFFFFF" stroke="#141414" strokeWidth="2.5" />
            </svg>

            <div className="relative flex flex-1 flex-col items-center px-5 pt-8 pb-8">
                <div className="rounded-[18px] border-[3px] border-ink bg-white px-4 py-2.5 text-[15px] font-bold whitespace-nowrap shadow-hard-sm">
                    I grew a flower, thanks to you!
                </div>
                <div className="mt-2 animate-pop">
                    <Mascot size={170} stage={5} mood="celebrate" />
                </div>
                <div className="text-center">
                    <div className="inline-block rounded-full bg-ink px-3.5 py-1.5 text-[13px] font-extrabold tracking-widest text-white">GOAL REACHED</div>
                    <h1 className="mt-2 font-display text-[44px] leading-[0.95] font-extrabold tracking-tight">{goal.title}</h1>
                    <div className="mt-1 font-display text-2xl font-extrabold">{money(goal.target)} saved!</div>
                </div>

                <div className="mt-auto w-full pt-6">
                    {waiting ? (
                        <div className="flex flex-col gap-3">
                            <div className="rounded-3xl border-[3px] border-ink bg-white p-4 text-center font-semibold shadow-hard" role="status">
                                Your request is with <b>{parentName}</b>. A grown-up decides and pays.
                            </div>
                            <Link href="/kid" className="press flex min-h-11 items-center justify-center rounded-full border-[3px] border-ink bg-ink p-5 font-extrabold text-white">
                                Back home
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="flex flex-col gap-3">
                            <label className="flex flex-col gap-1.5 rounded-3xl border-[3px] border-ink bg-white p-4 text-sm font-extrabold shadow-hard">
                                Why do you want it? (optional)
                                <textarea
                                    value={form.data.reason}
                                    onChange={(e) => form.setData('reason', e.target.value)}
                                    rows={2}
                                    maxLength={300}
                                    placeholder="I saved for 6 weeks and I want to build the spaceship."
                                    className="resize-none rounded-2xl border-[3px] border-ink p-3 text-base font-semibold"
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="press min-h-11 rounded-full border-[3px] border-ink bg-ink p-5 text-[17px] font-extrabold text-white"
                            >
                                Ask {parentName} to buy it
                            </button>
                            <Link href="/kid" className="min-h-11 text-center font-bold underline underline-offset-4">
                                Keep saving instead
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </Phone>
    );
}
