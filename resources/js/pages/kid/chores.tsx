import { Head, router } from '@inertiajs/react';
import { BottomNav } from '@/components/sprout/bottom-nav';
import { Phone } from '@/components/sprout/phone';
import { BackLink, MixedTitle } from '@/components/sprout/ui';
import { money } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { KidSummary } from '@/types/sprout';

type Chore = { id: number; title: string; reward: number; status: 'todo' | 'done' | 'approved' };

export default function KidChores({ kid, chores }: { kid: KidSummary; chores: Chore[] }) {
    const todo = chores.filter((c) => c.status === 'todo');

    return (
        <Phone bg="bg-cream" footer={<BottomNav variant="kid" active="chores" badges={{ chores: todo.length }} />}>
            <Head title="Chores" />
            <div className="flex flex-col gap-4 px-5 pt-6 pb-28">
                <div className="flex items-center gap-3">
                    <BackLink href="/kid" />
                    <div className="font-display text-[22px] font-extrabold">Chores</div>
                </div>

                <MixedTitle>
                    Earn money for <b>{kid.goal?.title ?? 'your goal'}</b>
                </MixedTitle>

                {chores.length === 0 && (
                    <div className="rounded-3xl border-[3px] border-dashed border-ink bg-white p-5 text-center font-semibold">
                        No chores right now. Ask a grown-up if you can help with something!
                    </div>
                )}

                <ul className="flex flex-col gap-3">
                    {chores.map((c) => (
                        <li
                            key={c.id}
                            className={cn(
                                'flex items-center gap-3 rounded-3xl border-[3px] border-ink p-4',
                                c.status === 'todo' && 'bg-white shadow-hard',
                                c.status === 'done' && 'bg-sky-50',
                                c.status === 'approved' && 'bg-leaf',
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="font-extrabold">{c.title}</div>
                                <div className="text-[13px] font-semibold text-ink-muted">
                                    {c.status === 'todo' && `Pays ${money(c.reward)}`}
                                    {c.status === 'done' && 'Waiting for a grown-up to check'}
                                    {c.status === 'approved' && <span className="text-ink">Paid +{money(c.reward)}</span>}
                                </div>
                            </div>
                            {c.status === 'todo' ? (
                                <button
                                    type="button"
                                    onClick={() => router.post(`/kid/chores/${c.id}/done`, {}, { preserveScroll: true })}
                                    className="press min-h-11 rounded-full border-[3px] border-ink bg-ink px-4 text-sm font-extrabold text-white"
                                >
                                    I did it!
                                </button>
                            ) : (
                                <span className="font-display text-xl font-extrabold">{c.status === 'approved' ? '✓' : '…'}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </Phone>
    );
}
