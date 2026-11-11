import { Head, Link, router } from '@inertiajs/react';
import { BottomNav } from '@/components/sprout/bottom-nav';
import { Coin, Mascot } from '@/components/sprout/mascot';
import { Phone } from '@/components/sprout/phone';
import { KidAvatar, ProgressBar } from '@/components/sprout/ui';
import { money } from '@/lib/money';
import type { KidSummary, OpenRequest, Transaction } from '@/types/sprout';

type Props = {
    kid: KidSummary;
    choresToDo: number;
    request: OpenRequest | null;
    recent: Transaction[];
};

function greeting(): string {
    const h = new Date().getHours();

    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const requestText: Record<OpenRequest['status'], [string, string]> = {
    pending: ['Your request for', 'is waiting for a grown-up.'],
    approved: ['A grown-up is paying for your', 'right now.'],
    paid: ['Your', 'was bought! Enjoy it.'],
    rejected: ['A grown-up said "not now" to', '. Keep saving!'],
};

export default function KidHome({ kid, choresToDo, request, recent }: Props) {
    const goal = kid.goal;

    return (
        <Phone bg="bg-sky" footer={<BottomNav variant="kid" active="home" badges={{ chores: choresToDo }} />}>
            <Head title="Home" />

            <div className="flex items-center justify-between px-5 pt-6">
                <div className="flex items-center gap-2.5">
                    <KidAvatar name={kid.name} avatar={kid.avatar} />
                    <div>
                        <div className="text-[13px] font-semibold">{greeting()}</div>
                        <div className="font-display text-[22px] leading-none font-extrabold">Hi, {kid.name}!</div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => router.post('/kid/logout')}
                    className="press min-h-11 rounded-full border-[3px] border-ink bg-white px-4 text-sm font-extrabold shadow-hard-sm"
                >
                    Switch
                </button>
            </div>

            <div className="relative h-[230px] flex-none">
                <div className="absolute inset-x-[-110px] top-[150px] h-[300px] rounded-[50%_50%_0_0/90px_90px_0_0] border-t-4 border-ink bg-grass" />
                <Coin size={34} className="absolute top-[118px] left-11" />
                <Coin size={28} className="absolute top-[134px] right-[52px]" />
                <div className="absolute top-1 left-1/2 -translate-x-1/2 animate-pop">
                    <Mascot size={140} stage={kid.level} />
                </div>
                <div className="absolute top-[184px] inset-x-0 flex flex-col items-center gap-1.5">
                    <div className="font-display text-xl font-extrabold">Sprout · Level {kid.level}</div>
                    <div className="flex gap-[5px]" role="img" aria-label={`${kid.level} of 5 leaves grown`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className={`h-3 w-7 rounded-full border-[2.5px] border-ink ${i <= kid.level ? 'bg-sun' : 'bg-white'}`} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="relative z-10 mx-5 mt-8 flex items-center justify-between rounded-[20px] border-[3px] border-ink bg-leaf-dark py-2.5 pr-2.5 pl-[18px] text-white">
                <div>
                    <div className="text-xs font-semibold">Next allowance</div>
                    <div className="font-extrabold">Sat · +{money(kid.weeklyAllowance)}</div>
                </div>
                <Link
                    href="/kid/chores"
                    className="press flex min-h-11 items-center rounded-full border-[3px] border-ink bg-white px-4 text-sm font-extrabold text-ink"
                >
                    Earn more
                </Link>
            </div>

            <div className="relative z-10 mt-4 flex flex-1 flex-col gap-3.5 rounded-t-[32px] border-t-4 border-ink bg-cream px-5 pt-5 pb-28">
                <div className="rounded-3xl border-[3px] border-ink bg-white p-[18px] shadow-hard">
                    <div className="text-[13px] font-bold text-ink-muted">My money</div>
                    <div className="font-display text-[40px] leading-[1.05] font-extrabold tracking-tight">{money(kid.balance)}</div>
                    {recent.length > 0 && (
                        <ul className="mt-2 flex flex-col gap-1 text-[13px] font-semibold">
                            {recent.slice(0, 3).map((t) => (
                                <li key={t.id} className="flex justify-between">
                                    <span className="text-ink-muted">{t.note ?? t.type}</span>
                                    <span className="font-extrabold">{t.amount > 0 ? `+${money(t.amount)}` : money(t.amount)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {request && (
                    <div className="rounded-[20px] border-[3px] border-ink bg-pink px-4 py-3 text-sm font-semibold" role="status">
                        {requestText[request.status][0]} <b>{request.item}</b>
                        {request.status === 'rejected' ? '' : ' '}
                        {requestText[request.status][1]}
                    </div>
                )}

                {goal ? (
                    <Link
                        href={goal.reached ? '/kid/goal/reached' : '/kid/goal'}
                        className="press flex items-center gap-3.5 rounded-3xl border-[3px] border-ink bg-orange px-4 py-3.5 no-underline shadow-hard"
                    >
                        <div className="flex size-[52px] flex-none items-center justify-center rounded-2xl border-[3px] border-ink bg-white font-display text-2xl font-extrabold">
                            {goal.reached ? '★' : '◎'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between font-extrabold">
                                <span className="truncate">{goal.reached ? `${goal.title} · ready!` : goal.title}</span>
                                <span>
                                    {money(goal.saved, { whole: true })} / {money(goal.target, { whole: true })}
                                </span>
                            </div>
                            <ProgressBar value={goal.progress} label={`${goal.progress} percent saved`} className="mt-2" />
                        </div>
                    </Link>
                ) : (
                    <Link
                        href="/kid/goal"
                        className="press flex min-h-11 items-center justify-center rounded-3xl border-[3px] border-dashed border-ink bg-white p-4 font-extrabold no-underline"
                    >
                        + Plant a savings goal
                    </Link>
                )}
            </div>
        </Phone>
    );
}
