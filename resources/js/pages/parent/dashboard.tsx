import { Head, Link, router } from '@inertiajs/react';
import { BottomNav } from '@/components/sprout/bottom-nav';
import { Phone } from '@/components/sprout/phone';
import { KidAvatar, ProgressBar, Sparkle, avatarBg } from '@/components/sprout/ui';
import { money } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { KidRef, KidSummary } from '@/types/sprout';

type NeedsYou = {
    kind: 'request' | 'chore';
    id: number;
    kid: KidRef;
    title: string;
    detail: string;
    amount: number;
    href: string;
};

type Props = {
    parentName: string;
    kids: KidSummary[];
    totalSaved: number;
    needsYou: NeedsYou[];
    paypalReady: boolean;
};

export default function Dashboard({ parentName, kids, totalSaved, needsYou, paypalReady }: Props) {
    const requests = needsYou.filter((n) => n.kind === 'request').length;
    const chores = needsYou.filter((n) => n.kind === 'chore').length;

    return (
        <Phone bg="bg-paper" footer={<BottomNav variant="parent" active="home" badges={{ approvals: requests, chores }} />}>
            <Head title="Parent home" />
            <div className="flex flex-col gap-3.5 px-5 pt-6 pb-28">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-11 items-center justify-center rounded-full border-[3px] border-ink bg-sky font-display text-lg font-extrabold" aria-hidden="true">
                            {parentName.charAt(0)}
                        </div>
                        <div>
                            <div className="text-[13px] font-semibold">Parent</div>
                            <h1 className="font-display text-[22px] leading-none font-extrabold">Hi, {parentName}</h1>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.post('/logout')}
                        className="press min-h-11 rounded-full border-[3px] border-ink bg-white px-4 text-sm font-extrabold shadow-hard-sm"
                    >
                        Sign out
                    </button>
                </div>

                <div className="rounded-[26px] bg-ink p-[18px] text-white shadow-[4px_4px_0_#3DDC5A]">
                    <div className="flex items-center justify-between">
                        <div className="text-[13px] font-bold text-[#D6D6D6]">Kids&apos; savings</div>
                        <div className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-ink">
                            {paypalReady ? 'PayPal on approval' : 'PayPal sandbox not set'}
                        </div>
                    </div>
                    <div className="mt-1 font-display text-[40px] font-extrabold tracking-tight">{money(totalSaved)}</div>
                    <p className="text-xs font-semibold text-[#D6D6D6]">Virtual credit. Real money only moves when you approve a purchase.</p>
                    <div className="mt-3 flex gap-2.5">
                        <Link
                            href="/parent/approvals"
                            className="press flex min-h-11 flex-1 items-center justify-center rounded-full border-[2.5px] border-white bg-leaf p-3 text-[15px] font-extrabold text-ink"
                        >
                            Approvals{requests > 0 ? ` · ${requests}` : ''}
                        </Link>
                        <Link
                            href="/parent/kids/create"
                            className="press flex min-h-11 flex-1 items-center justify-center rounded-full border-[2.5px] border-white p-3 text-[15px] font-extrabold text-white"
                        >
                            Add a kid
                        </Link>
                    </div>
                </div>

                <section>
                    <h2 className="mb-2 font-extrabold">Needs you · {needsYou.length}</h2>
                    {needsYou.length === 0 ? (
                        <p className="rounded-[18px] border-[3px] border-dashed border-ink bg-white px-4 py-3 text-sm font-semibold">All caught up.</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {needsYou.map((n) => (
                                <li key={`${n.kind}-${n.id}`}>
                                    <Link
                                        href={n.href}
                                        className="press flex min-h-11 items-center gap-3 rounded-[18px] border-[3px] border-ink bg-white px-3 py-2.5 no-underline"
                                    >
                                        <KidAvatar name={n.kid.name} avatar={n.kid.avatar} size={38} />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-extrabold">{n.title}</div>
                                            <div className="text-xs font-semibold text-ink-muted">{n.detail}</div>
                                        </div>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section>
                    <h2 className="mb-2 font-extrabold">My kids</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {kids.map((k) => (
                            <Link
                                key={k.id}
                                href={`/parent/kids/${k.id}`}
                                className={cn('press rounded-[22px] border-[3px] border-ink p-3.5 no-underline shadow-hard', avatarBg(k.avatar))}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="font-extrabold">{k.name}</div>
                                    <div className="rounded-full border-2 border-ink bg-white px-2 py-0.5 text-[11px] font-extrabold">Lv {k.level}</div>
                                </div>
                                <div className="mt-1.5 font-display text-[28px] font-extrabold">{money(k.balance)}</div>
                                {k.goal ? (
                                    <>
                                        <div className="mt-1.5 truncate text-xs font-bold">
                                            {k.goal.title} · {k.goal.progress}%
                                        </div>
                                        <ProgressBar value={k.goal.progress} label={`${k.goal.progress} percent`} className="mt-1 h-2 border-2" />
                                    </>
                                ) : (
                                    <div className="mt-1.5 text-xs font-bold">No goal yet</div>
                                )}
                            </Link>
                        ))}
                        {kids.length === 0 && (
                            <Link href="/parent/kids/create" className="col-span-2 rounded-[22px] border-[3px] border-dashed border-ink bg-white p-5 text-center font-extrabold">
                                + Add your first kid
                            </Link>
                        )}
                    </div>
                </section>

                {kids.length > 0 && (
                    <Link href="/parent/reports" className="press flex items-center gap-3 rounded-[20px] border-[3px] border-ink bg-leaf px-3.5 py-3 no-underline">
                        <Sparkle size={26} />
                        <div className="flex-1 text-sm leading-snug font-semibold">
                            <b>Sprout&apos;s weekly report is ready.</b> See what your kids practised.
                        </div>
                    </Link>
                )}

                <a href="/kid/login" className="text-center text-sm font-bold underline underline-offset-4">
                    Switch to kid sign-in on this device
                </a>
            </div>
        </Phone>
    );
}
