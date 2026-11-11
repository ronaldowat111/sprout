import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { MascotBadge } from '@/components/sprout/mascot';
import { Phone } from '@/components/sprout/phone';
import { BackLink } from '@/components/sprout/ui';
import { money } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { ChatMessage, Choice, KidSummary } from '@/types/sprout';

type Props = { kid: KidSummary; messages: ChatMessage[]; aiEnabled: boolean; prefill: string | null };

const choiceColors = ['bg-leaf', 'bg-white', 'bg-white'];
const choiceIcons = ['bg-white', 'bg-orange', 'bg-pink'];

export default function Coach({ kid, messages, aiEnabled, prefill }: Props) {
    const [text, setText] = useState(prefill ?? '');
    const [pending, setPending] = useState<string | null>(null);
    const scroller = useRef<HTMLDivElement>(null);
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    const starters = kid.goal
        ? [`How long until my ${kid.goal.title}?`, 'How can I save faster?', 'Can I buy a game for $15?']
        : ['I want to save for something', 'How can I earn money?'];

    useEffect(() => {
        scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
    }, [messages.length, pending]);

    const send = (message: string) => {
        const m = message.trim();
        if (!m || pending) {
            return;
        }

        setPending(m);
        setText('');
        router.post(
            '/kid/coach',
            { message: m },
            {
                preserveScroll: true,
                onFinish: () => setPending(null),
            },
        );
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        send(text);
    };

    return (
        <Phone bg="bg-sky-50">
            <Head title="Ask Sprout" />
            <div className="flex flex-none items-center gap-3 border-b-[3px] border-ink bg-sky px-5 pt-5 pb-3.5">
                <BackLink href="/kid" />
                <MascotBadge size={48} />
                <div className="flex-1">
                    <div className="font-display text-xl leading-tight font-extrabold">Ask Sprout</div>
                    <div className="text-[13px] font-semibold">
                        Your money buddy · {money(kid.balance)} saved
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        type="button"
                        onClick={() => router.delete('/kid/coach')}
                        className="min-h-11 text-[13px] font-bold underline underline-offset-4"
                    >
                        New chat
                    </button>
                )}
            </div>

            <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pt-4 pb-3" aria-live="polite">
                {messages.length === 0 && !pending && (
                    <div className="m-auto flex max-w-[280px] flex-col items-center gap-3 text-center">
                        <MascotBadge size={72} className="bg-sun" />
                        <p className="font-semibold">
                            Hi {kid.name}! Thinking of buying something? Ask me first and we&apos;ll work it out together.
                        </p>
                        {!aiEnabled && <p className="text-xs font-semibold text-ink-muted">Offline mode: simple answers only.</p>}
                    </div>
                )}

                {messages.map((m) => (
                    <div key={m.id} className="contents">
                        <Bubble role={m.role}>{m.content}</Bubble>
                        {m.id === lastAssistant?.id && m.choices && m.choices.length > 0 && !pending && (
                            <Choices choices={m.choices} onPick={send} />
                        )}
                    </div>
                ))}

                {pending && (
                    <>
                        <Bubble role="user">{pending}</Bubble>
                        <div className="flex gap-1.5 self-start rounded-[20px_20px_20px_6px] border-[3px] border-ink bg-white px-4 py-3.5" aria-label="Sprout is thinking">
                            {[0, 1, 2].map((i) => (
                                <span key={i} className="size-2 animate-bounce rounded-full bg-ink" style={{ animationDelay: `${i * 120}ms` }} />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-none flex-col gap-2.5 bg-sky-50 px-4 pt-2 pb-6">
                {messages.length === 0 && !pending && (
                    <div className="flex flex-wrap gap-2">
                        {starters.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => send(s)}
                                className="press min-h-11 rounded-full border-[2.5px] border-ink bg-white px-3.5 text-[13px] font-bold"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
                <form onSubmit={submit} className="flex items-center gap-2">
                    <label htmlFor="ask" className="sr-only">
                        Ask Sprout
                    </label>
                    <input
                        id="ask"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={300}
                        autoComplete="off"
                        placeholder="Ask Sprout anything…"
                        className="min-h-[54px] min-w-0 flex-1 rounded-full border-[3px] border-ink bg-white px-[18px] text-[15px] font-semibold outline-none"
                    />
                    <button
                        type="submit"
                        aria-label="Send"
                        disabled={!text.trim() || !!pending}
                        className="press flex size-[54px] flex-none items-center justify-center rounded-full bg-ink disabled:opacity-40"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                    </button>
                </form>
            </div>
        </Phone>
    );
}

function Bubble({ role, children }: { role: 'user' | 'assistant'; children: string }) {
    return (
        <div
            className={cn(
                'animate-rise px-4 py-3 text-[15px] leading-snug whitespace-pre-line',
                role === 'user'
                    ? 'max-w-[78%] self-end rounded-[20px_20px_6px_20px] bg-ink font-semibold text-white'
                    : 'max-w-[86%] self-start rounded-[20px_20px_20px_6px] border-[3px] border-ink bg-white font-medium',
            )}
        >
            {children}
        </div>
    );
}

function Choices({ choices, onPick }: { choices: Choice[]; onPick: (title: string) => void }) {
    return (
        <div className="flex w-[86%] animate-rise flex-col gap-2 self-start">
            {choices.map((c, i) => (
                <button
                    key={c.title}
                    type="button"
                    onClick={() => onPick(c.title)}
                    className={cn(
                        'press flex min-h-11 items-center gap-3 rounded-[18px] border-[3px] border-ink px-3 py-2.5 text-left',
                        choiceColors[i],
                        i === 0 && 'shadow-hard-sm',
                    )}
                >
                    <span className={cn('flex size-9 flex-none items-center justify-center rounded-xl border-[2.5px] border-ink font-display font-extrabold', choiceIcons[i])} aria-hidden="true">
                        {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-extrabold">{c.title}</span>
                        {c.detail && <span className={cn('block text-xs font-semibold', i === 0 ? 'text-ink' : 'text-ink-muted')}>{c.detail}</span>}
                    </span>
                </button>
            ))}
        </div>
    );
}
