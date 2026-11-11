import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { BottomNav } from '@/components/sprout/bottom-nav';
import { Phone } from '@/components/sprout/phone';
import { KidAvatar, Sparkle } from '@/components/sprout/ui';
import { money } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { KidRef } from '@/types/sprout';

type Chore = {
    id: number;
    title: string;
    reward: number;
    status: 'todo' | 'done' | 'approved';
    kid: Required<KidRef>;
    when: string | null;
};

type Props = {
    kids: Required<KidRef>[];
    chores: Chore[];
    tip: { name: string; goal: string; missing: number } | null;
};

type Tab = 'done' | 'todo' | 'approved';

export default function ParentChores({ kids, chores, tip }: Props) {
    const toCheck = chores.filter((c) => c.status === 'done');
    const [tab, setTab] = useState<Tab>(toCheck.length > 0 ? 'done' : 'todo');
    const [adding, setAdding] = useState(false);
    const form = useForm({ kid_id: kids[0]?.id ?? 0, title: '', reward: '2' });
    const shown = chores.filter((c) => c.status === tab);
    const counts = { done: toCheck.length, todo: chores.filter((c) => c.status === 'todo').length, approved: 0 };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/parent/chores', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('title');
                setAdding(false);
                setTab('todo');
            },
        });
    };

    const tabs: [Tab, string][] = [
        ['done', `To check${counts.done ? ` · ${counts.done}` : ''}`],
        ['todo', `Active${counts.todo ? ` · ${counts.todo}` : ''}`],
        ['approved', 'Paid'],
    ];

    return (
        <Phone bg="bg-paper" footer={<BottomNav variant="parent" active="chores" badges={{ chores: counts.done }} />}>
            <Head title="Chores" />
            <div className="flex flex-col gap-3.5 px-5 pt-6 pb-28">
                <div className="flex items-center justify-between">
                    <h1 className="font-display text-[28px] font-extrabold">Chores</h1>
                    <button
                        type="button"
                        onClick={() => setAdding((v) => !v)}
                        aria-expanded={adding}
                        className="press flex min-h-11 items-center gap-1.5 rounded-full border-[3px] border-ink bg-leaf px-4 text-sm font-extrabold shadow-hard-sm"
                    >
                        {adding ? 'Close' : '+ New chore'}
                    </button>
                </div>

                {adding && (
                    <form onSubmit={submit} className="flex animate-rise flex-col gap-3 rounded-3xl border-[3px] border-ink bg-white p-4 shadow-hard">
                        <label className="flex flex-col gap-1.5 text-sm font-extrabold">
                            For
                            <select
                                value={form.data.kid_id}
                                onChange={(e) => form.setData('kid_id', Number(e.target.value))}
                                className="min-h-11 rounded-2xl border-[3px] border-ink bg-white px-3 font-semibold"
                            >
                                {kids.map((k) => (
                                    <option key={k.id} value={k.id}>
                                        {k.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-extrabold">
                            Chore
                            <input
                                value={form.data.title}
                                onChange={(e) => form.setData('title', e.target.value)}
                                placeholder="e.g. Wash the car"
                                maxLength={60}
                                className="min-h-11 rounded-2xl border-[3px] border-ink px-4 font-semibold"
                            />
                            {form.errors.title && <span className="text-xs">{form.errors.title}</span>}
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-extrabold">
                            Reward ($)
                            <input
                                value={form.data.reward}
                                onChange={(e) => form.setData('reward', e.target.value)}
                                inputMode="decimal"
                                className="min-h-11 rounded-2xl border-[3px] border-ink px-4 font-semibold"
                            />
                            {form.errors.reward && <span className="text-xs">{form.errors.reward}</span>}
                        </label>
                        <button type="submit" disabled={form.processing} className="press min-h-11 rounded-full border-[3px] border-ink bg-ink p-3 font-extrabold text-white">
                            Post chore
                        </button>
                    </form>
                )}

                <div role="tablist" aria-label="Chore status" className="grid grid-cols-3 gap-1 rounded-full border-[3px] border-ink bg-white p-1">
                    {tabs.map(([key, label]) => (
                        <button
                            key={key}
                            role="tab"
                            type="button"
                            aria-selected={tab === key}
                            onClick={() => setTab(key)}
                            className={cn('min-h-11 rounded-full text-[13px]', tab === key ? 'bg-ink font-extrabold text-white' : 'font-bold')}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div role="tabpanel" className="flex flex-col gap-3">
                    {shown.length === 0 && (
                        <p className="rounded-[20px] border-[3px] border-dashed border-ink bg-white px-4 py-3 text-sm font-semibold">
                            {tab === 'done' ? 'Nothing to check right now.' : tab === 'todo' ? 'No active chores. Post one!' : 'No paid chores yet.'}
                        </p>
                    )}

                    {tab === 'done' &&
                        shown.map((c) => (
                            <div key={c.id} className="animate-rise overflow-hidden rounded-3xl border-[3px] border-ink bg-white shadow-hard">
                                <div className="flex items-center gap-3 border-b-[3px] border-ink bg-sky px-4 py-3">
                                    <KidAvatar name={c.kid.name} avatar={c.kid.avatar} size={36} />
                                    <div className="text-sm font-extrabold">{c.kid.name} says it&apos;s done</div>
                                </div>
                                <div className="px-4 pt-3.5 pb-4">
                                    <div className="flex items-baseline justify-between">
                                        <div className="text-[17px] font-extrabold">{c.title}</div>
                                        <div className="font-display text-2xl font-extrabold">{money(c.reward)}</div>
                                    </div>
                                    <div className="mt-0.5 text-[13px] font-semibold text-ink-muted">Marked done {c.when}</div>
                                    <div className="mt-3.5 flex gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => router.post(`/parent/chores/${c.id}/approve`, {}, { preserveScroll: true })}
                                            className="press min-h-11 flex-1 rounded-full border-[3px] border-ink bg-ink p-3 font-extrabold text-white"
                                        >
                                            Approve &amp; pay
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => router.post(`/parent/chores/${c.id}/redo`, {}, { preserveScroll: true })}
                                            className="press min-h-11 flex-1 rounded-full border-[3px] border-ink bg-white p-3 font-extrabold"
                                        >
                                            Ask to redo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                    {tab !== 'done' && shown.length > 0 && (
                        <ul className="rounded-[20px] border-[3px] border-ink bg-white px-3.5 py-0.5">
                            {shown.map((c, i) => (
                                <li key={c.id} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t-2 border-line')}>
                                    <KidAvatar name={c.kid.name} avatar={c.kid.avatar} size={32} />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-bold">{c.title}</div>
                                        {tab === 'approved' && <div className="text-xs font-semibold text-ink-muted">Paid {c.when}</div>}
                                    </div>
                                    <div className="text-sm font-extrabold">{money(c.reward, { whole: true })}</div>
                                    {tab === 'todo' && (
                                        <button
                                            type="button"
                                            aria-label={`Remove ${c.title}`}
                                            onClick={() => router.delete(`/parent/chores/${c.id}`, { preserveScroll: true })}
                                            className="flex size-11 items-center justify-center rounded-full text-lg font-extrabold"
                                        >
                                            ×
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {tip && (
                    <div className="flex items-start gap-2.5 rounded-[20px] border-[3px] border-ink bg-sun px-3.5 py-3">
                        <Sparkle size={22} />
                        <p className="text-[13px] leading-snug font-semibold">
                            <b>Sprout suggests:</b> {tip.name} is {money(tip.missing, { whole: true })} from the {tip.goal}. A small weekend chore would bring it closer.
                        </p>
                    </div>
                )}
            </div>
        </Phone>
    );
}
