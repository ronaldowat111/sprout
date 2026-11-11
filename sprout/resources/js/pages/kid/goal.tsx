import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { BottomNav } from '@/components/sprout/bottom-nav';
import { MascotBadge } from '@/components/sprout/mascot';
import { Phone } from '@/components/sprout/phone';
import { BackLink, MixedTitle, ProgressBar } from '@/components/sprout/ui';
import { money } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { KidSummary, OpenRequest } from '@/types/sprout';

type Props = { kid: KidSummary; choreAverage: number; openChores: number; request: OpenRequest | null };

const stages = ['Seed', 'Sprout', 'Bud', 'Bloom'];

function GoalForm({ onDone, initial }: { onDone?: () => void; initial?: { title: string; target: number } }) {
    const form = useForm({ title: initial?.title ?? '', target: initial ? String(initial.target / 100) : '' });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/kid/goal', { onSuccess: () => onDone?.() });
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-3 rounded-3xl border-[3px] border-ink bg-white p-4 shadow-hard">
            <label className="flex flex-col gap-1.5 text-sm font-extrabold">
                What are you saving for?
                <input
                    value={form.data.title}
                    onChange={(e) => form.setData('title', e.target.value)}
                    placeholder="e.g. Lego set"
                    maxLength={60}
                    className="min-h-11 rounded-2xl border-[3px] border-ink px-4 text-base font-semibold"
                />
                {form.errors.title && <span className="text-xs">{form.errors.title}</span>}
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-extrabold">
                How much does it cost?
                <div className="flex items-center rounded-2xl border-[3px] border-ink px-4">
                    <span className="font-display text-xl font-extrabold">$</span>
                    <input
                        value={form.data.target}
                        onChange={(e) => form.setData('target', e.target.value)}
                        inputMode="decimal"
                        placeholder="30"
                        className="min-h-11 w-full border-0 px-2 text-base font-semibold outline-none"
                    />
                </div>
                {form.errors.target && <span className="text-xs">{form.errors.target}</span>}
            </label>
            <button type="submit" disabled={form.processing} className="press min-h-11 rounded-full border-[3px] border-ink bg-ink p-4 font-extrabold text-white">
                Plant my goal
            </button>
        </form>
    );
}

export default function KidGoal({ kid, choreAverage, openChores, request }: Props) {
    const goal = kid.goal;
    const [editing, setEditing] = useState(false);
    const stage = goal ? Math.min(3, Math.floor(goal.progress / 34) + (goal.reached ? 1 : 0)) : 0;
    const perWeek = kid.weeklyAllowance + choreAverage;
    const fasterWeeks =
        goal && !goal.reached ? Math.ceil((goal.target - goal.saved) / (perWeek + 200)) : null;

    return (
        <Phone bg="bg-cream" footer={<BottomNav variant="kid" active="goal" badges={{ chores: openChores }} />}>
            <Head title="My goal" />
            <div className="flex flex-col gap-4 px-5 pt-6 pb-28">
                <div className="flex items-center justify-between">
                    <BackLink href="/kid" />
                    <div className="font-display text-[22px] font-extrabold">My goal</div>
                    {goal ? (
                        <button
                            type="button"
                            aria-label="Change goal"
                            onClick={() => setEditing((v) => !v)}
                            className="press flex size-11 items-center justify-center rounded-full border-[3px] border-ink bg-white shadow-hard-sm"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M4 20h4L19 9l-4-4L4 16z" />
                            </svg>
                        </button>
                    ) : (
                        <span className="size-11" />
                    )}
                </div>

                {!goal || editing ? (
                    <>
                        <MixedTitle>
                            Plant a <b>new goal</b>
                        </MixedTitle>
                        <GoalForm onDone={() => setEditing(false)} initial={goal ? { title: goal.title, target: goal.target } : undefined} />
                    </>
                ) : (
                    <>
                        <div className="animate-pop rounded-[28px] border-[3px] border-ink bg-orange p-5 shadow-hard-lg">
                            <div className="font-display text-[34px] leading-none font-extrabold tracking-tight">{goal.title}</div>
                            <div className="mt-2.5 flex items-baseline justify-between">
                                <div className="text-lg font-extrabold">
                                    {money(goal.saved)} <span className="text-[15px] font-semibold">of {money(goal.target)}</span>
                                </div>
                                <div className="text-[15px] font-extrabold">
                                    {goal.reached ? 'Ready!' : `${money(goal.target - goal.saved)} to go`}
                                </div>
                            </div>
                            <ProgressBar value={goal.progress} label={`${goal.progress} percent saved`} className="mt-2 h-[22px] border-[3px]" />
                        </div>

                        <div className="rounded-3xl border-[3px] border-ink bg-white p-4">
                            <div className="mb-3 font-extrabold">Your goal plant</div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                {stages.map((label, i) => (
                                    <div key={label} className="flex flex-col items-center gap-1.5">
                                        <div
                                            className={cn(
                                                'flex size-14 items-center justify-center rounded-[18px] border-[3px] border-ink font-display text-xl font-extrabold',
                                                i < stage && 'bg-leaf',
                                                i === stage && 'bg-sun shadow-hard-sm',
                                                i > stage && 'border-dashed bg-white',
                                            )}
                                            aria-hidden="true"
                                        >
                                            {['•', '❦', '✿', '❀'][i]}
                                        </div>
                                        <div className={cn('text-xs', i === stage ? 'font-extrabold' : 'font-bold')}>
                                            {label}
                                            {i === stage ? ' · now' : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-end gap-2.5">
                            <MascotBadge size={54} className="bg-sky" />
                            <p className="flex-1 rounded-[20px_20px_20px_6px] border-[3px] border-ink bg-white px-3.5 py-3 text-sm leading-snug font-semibold">
                                {goal.reached ? (
                                    <>
                                        You did it! You have enough for your <b>{goal.title}</b>. Ask a grown-up to buy it.
                                    </>
                                ) : goal.weeksLeft === null ? (
                                    <>Do some chores to start growing your goal!</>
                                ) : (
                                    <>
                                        At {money(perWeek)} a week you&apos;ll get there in{' '}
                                        <b>
                                            about {goal.weeksLeft} week{goal.weeksLeft === 1 ? '' : 's'}
                                        </b>
                                        .
                                        {fasterWeeks !== null && fasterWeeks < goal.weeksLeft && (
                                            <>
                                                {' '}
                                                One extra $2 chore a week makes it <b>{goal.weeksLeft - fasterWeeks} week sooner!</b>
                                            </>
                                        )}
                                    </>
                                )}
                            </p>
                        </div>

                        {request && request.status !== 'rejected' && request.status !== 'paid' && (
                            <div className="rounded-[20px] border-[3px] border-ink bg-pink px-4 py-3 text-sm font-semibold" role="status">
                                Your request for <b>{request.item}</b> is waiting for a grown-up.
                            </div>
                        )}

                        <div className="mt-2 flex gap-2.5">
                            {goal.reached ? (
                                <Link
                                    href="/kid/goal/reached"
                                    className="press flex min-h-11 flex-1 items-center justify-center rounded-full border-[3px] border-ink bg-ink p-[18px] font-extrabold text-white"
                                >
                                    I&apos;m ready!
                                </Link>
                            ) : (
                                <Link
                                    href="/kid/chores"
                                    className="press flex min-h-11 flex-1 items-center justify-center rounded-full border-[3px] border-ink bg-ink p-[18px] font-extrabold text-white"
                                >
                                    Earn more
                                </Link>
                            )}
                            <Link
                                href={`/kid/coach?ask=${encodeURIComponent(`How is my ${goal.title} goal going?`)}`}
                                className="press flex min-h-11 items-center rounded-full border-[3px] border-ink bg-white px-5 py-[18px] font-extrabold shadow-hard-sm"
                            >
                                Ask Sprout
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </Phone>
    );
}
