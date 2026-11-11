import { Head, Link } from '@inertiajs/react';
import { BottomNav } from '@/components/sprout/bottom-nav';
import { Phone } from '@/components/sprout/phone';
import { KidAvatar, Shield, avatarBg } from '@/components/sprout/ui';
import { money, percent } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { KidRef, KidSummary } from '@/types/sprout';

type Report = {
    kid: KidSummary;
    stats: {
        from: string;
        to: string;
        in: number;
        allowance: number;
        chores: number;
        spent: number;
        saved: number;
        balance: number;
        choresDone: number;
    };
    notes: { topics: string[]; proud: string; dinner: string; ai: boolean };
    chatCount: number;
};

/** P5: Sprout's weekly report. Summaries only; parents never see raw chats. */
export default function ParentReport({ kids, report }: { kids: Required<KidRef>[]; report: Report | null }) {
    if (!report) {
        return (
            <Phone bg="bg-paper" footer={<BottomNav variant="parent" active="reports" />}>
                <Head title="Weekly report" />
                <div className="p-6 font-semibold">Add a kid to see their weekly report.</div>
            </Phone>
        );
    }

    const { kid, stats, notes } = report;
    const spentPct = percent(stats.spent, Math.max(stats.in, stats.spent));

    return (
        <Phone bg="bg-paper" footer={<BottomNav variant="parent" active="reports" />}>
            <Head title="Weekly report" />
            <div className="flex flex-col gap-3 px-5 pt-6 pb-28">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[13px] font-bold text-ink-muted">
                            {stats.from} – {stats.to}
                        </div>
                        <h1 className="font-display text-[26px] leading-tight font-extrabold">Weekly report</h1>
                    </div>
                </div>

                {kids.length > 1 && (
                    <nav aria-label="Choose kid" className="flex gap-2">
                        {kids.map((k) => (
                            <Link
                                key={k.id}
                                href={`/parent/reports?kid=${k.id}`}
                                aria-current={k.id === kid.id ? 'page' : undefined}
                                className={cn(
                                    'press flex min-h-11 items-center gap-2 rounded-full border-[3px] border-ink py-1.5 pr-4 pl-1.5 text-sm font-extrabold',
                                    k.id === kid.id ? cn(avatarBg(k.avatar), 'shadow-hard-xs') : 'bg-white',
                                )}
                            >
                                <KidAvatar name={k.name} avatar={k.avatar} size={28} />
                                {k.name}
                            </Link>
                        ))}
                    </nav>
                )}

                <div className="rounded-3xl border-[3px] border-ink bg-white p-4 shadow-hard">
                    <div className="flex items-baseline justify-between">
                        <div className="font-extrabold">Money in</div>
                        <div className="font-display text-[26px] font-extrabold">{money(stats.in)}</div>
                    </div>
                    <div className="text-xs font-semibold text-ink-muted">
                        {money(stats.allowance)} allowance + {money(stats.chores)} from chores
                    </div>
                    <div
                        className="mt-3 flex h-[22px] overflow-hidden rounded-full border-[3px] border-ink"
                        role="img"
                        aria-label={`Spent ${money(stats.spent)}, saved ${money(stats.saved)}`}
                    >
                        <div className="bg-spend" style={{ width: `${spentPct}%` }} />
                        <div className={cn('flex-1 bg-leaf-dark', spentPct > 0 && spentPct < 100 && 'border-l-[3px] border-ink')} />
                    </div>
                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                        <div>
                            <div className="text-xs font-bold">Spent</div>
                            <div className="font-extrabold">{money(stats.spent)}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold">Saved</div>
                            <div className="font-extrabold">{money(stats.saved)}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold">Chores</div>
                            <div className="font-extrabold">{stats.choresDone}</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border-[3px] border-ink bg-white px-4 py-3.5">
                    <div className="font-extrabold">Practised with Sprout</div>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                        {notes.topics.map((t) => (
                            <span key={t} className="rounded-full border-2 border-ink bg-sky-50 px-3 py-1.5 text-[13px] font-bold">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border-[3px] border-ink bg-leaf px-4 py-3.5">
                    <div className="font-extrabold">★ Proud moment</div>
                    <p className="mt-1.5 text-sm leading-snug font-semibold">{notes.proud}</p>
                </div>

                <div className="rounded-3xl border-[3px] border-ink bg-sun px-4 py-3.5">
                    <div className="font-extrabold">Ask at dinner</div>
                    <p className="mt-1 font-display text-[19px] leading-tight font-bold">{notes.dinner}</p>
                </div>

                <p className="flex items-center gap-2 text-xs font-semibold text-[#333333]">
                    <Shield size={16} />
                    You see summaries, not full chats, so {kid.name} can ask freely.
                    {notes.ai ? '' : ' (Offline summary.)'}
                </p>
            </div>
        </Phone>
    );
}
