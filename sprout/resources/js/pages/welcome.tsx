import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode, TouchEvent } from 'react';
import { Burst, Coin, Mascot } from '@/components/sprout/mascot';
import { Phone } from '@/components/sprout/phone';
import { cn } from '@/lib/utils';

type Step = {
    bg: string;
    hero: ReactNode;
    title: ReactNode;
    text: string;
};

function GoalSticker() {
    return (
        <svg width="190" height="190" viewBox="0 0 200 200" aria-hidden="true">
            <rect x="34" y="40" width="132" height="120" rx="20" fill="#FFFFFF" stroke="#141414" strokeWidth="6" />
            <path d="M58 76 h84" stroke="#141414" strokeWidth="6" strokeLinecap="round" />
            <rect x="58" y="96" width="84" height="20" rx="10" fill="#FFFFFF" stroke="#141414" strokeWidth="5" />
            <rect x="58" y="96" width="58" height="20" rx="10" fill="#141414" />
            <path d="M58 136 h44" stroke="#141414" strokeWidth="6" strokeLinecap="round" />
            <path d="M150 20 v48" stroke="#141414" strokeWidth="6" strokeLinecap="round" />
            <path d="M150 22 l34 12 -34 12 z" fill="#FF8FB1" stroke="#141414" strokeWidth="5" strokeLinejoin="round" />
            <circle cx="44" cy="164" r="22" fill="#FFC93C" stroke="#141414" strokeWidth="5" />
            <text x="44" y="173" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="24" fill="#141414">
                $
            </text>
        </svg>
    );
}

function ChatSticker() {
    return (
        <div className="relative">
            <svg width="200" height="150" viewBox="0 0 200 150" aria-hidden="true">
                <path
                    d="M20 20 h120 a16 16 0 0 1 16 16 v48 a16 16 0 0 1 -16 16 h-74 l-26 22 v-22 h-20 a16 16 0 0 1 -16 -16 v-48 a16 16 0 0 1 16 -16 z"
                    fill="#FFFFFF"
                    stroke="#141414"
                    strokeWidth="6"
                    strokeLinejoin="round"
                />
                <circle cx="56" cy="60" r="7" fill="#141414" />
                <circle cx="82" cy="60" r="7" fill="#141414" />
                <circle cx="108" cy="60" r="7" fill="#141414" />
                <text x="174" y="44" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="40" fill="#141414">
                    ?
                </text>
            </svg>
            <div className="absolute -right-6 -bottom-16">
                <Mascot size={120} stage={2} />
            </div>
        </div>
    );
}

const steps: Step[] = [
    {
        bg: 'bg-leaf',
        hero: (
            <div className="relative">
                <Burst size={260} className="absolute -top-8 left-1/2 -translate-x-1/2" />
                <Coin size={44} className="absolute top-2 -left-6" />
                <Coin size={34} className="absolute top-14 -right-8" />
                <Mascot size={180} stage={3} />
            </div>
        ),
        title: (
            <>
                Plant Your Money, <b>Watch It Grow</b>
            </>
        ),
        text: 'Sprout grows a new leaf every time you save.',
    },
    {
        bg: 'bg-orange',
        hero: (
            <div className="relative">
                <Burst size={260} className="absolute -top-10 left-1/2 -translate-x-1/2" />
                <GoalSticker />
            </div>
        ),
        title: (
            <>
                <b>Save</b> for What You <b>Really Want</b>
            </>
        ),
        text: 'Set a goal, do chores, and see how many weeks to go.',
    },
    {
        bg: 'bg-sky',
        hero: (
            <div className="relative pb-12">
                <ChatSticker />
            </div>
        ),
        title: (
            <>
                Ask <b>Sprout</b> Before <b>You Buy</b>
            </>
        ),
        text: 'Your money buddy helps you think. A grown-up says yes.',
    },
];

/** K1 onboarding: a 3-step carousel in the style of the UI brief. */
export default function Welcome() {
    const [step, setStep] = useState(0);
    const touchX = useRef<number | null>(null);
    const headline = useRef<HTMLHeadingElement>(null);
    const last = step === steps.length - 1;
    const current = steps[step];

    useEffect(() => {
        headline.current?.focus({ preventScroll: true });
    }, [step]);

    const go = (next: number) => setStep(Math.max(0, Math.min(steps.length - 1, next)));

    const onTouchEnd = (e: TouchEvent) => {
        if (touchX.current === null) {
            return;
        }

        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) {
            go(step + (dx < 0 ? 1 : -1));
        }

        touchX.current = null;
    };

    return (
        <Phone bg={cn(current.bg, 'transition-colors duration-300')}>
            <Head title="Welcome" />
            <section
                aria-roledescription="carousel"
                aria-label="Welcome to Sprout"
                className="flex flex-1 flex-col px-6 pt-6 pb-8"
                onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
                onTouchEnd={onTouchEnd}
            >
                <div className="flex items-center justify-between">
                    <div className="font-display text-2xl font-extrabold tracking-tight">sprout</div>
                    {!last && (
                        <button
                            type="button"
                            onClick={() => go(steps.length - 1)}
                            className="press min-h-11 rounded-full border-[3px] border-ink bg-white px-5 text-sm font-bold shadow-hard-sm"
                        >
                            Skip
                        </button>
                    )}
                </div>

                <div
                    key={step}
                    aria-roledescription="slide"
                    aria-label={`Step ${step + 1} of ${steps.length}`}
                    className="flex flex-1 flex-col"
                >
                    <div className="flex flex-1 animate-pop items-center justify-center pt-4">{current.hero}</div>
                    <div className="animate-rise text-center">
                        <h1
                            ref={headline}
                            tabIndex={-1}
                            className="mx-auto max-w-[320px] font-display text-[32px] leading-[1.12] font-normal tracking-tight outline-none [&_b]:font-extrabold"
                        >
                            {current.title}
                        </h1>
                        <p className="mx-auto mt-3 max-w-[280px] text-[15px] leading-snug font-medium">{current.text}</p>
                    </div>
                </div>

                <div className="mt-6 flex flex-col items-center gap-4">
                    <div className="flex gap-2">
                        {steps.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => go(i)}
                                aria-label={`Step ${i + 1} of ${steps.length}`}
                                aria-current={i === step ? 'step' : undefined}
                                className="flex h-11 items-center"
                            >
                                <span
                                    className={cn(
                                        'block h-2.5 rounded-full border-2 border-ink transition-all',
                                        i === step ? 'w-6 bg-ink' : 'w-2.5 bg-white',
                                    )}
                                />
                            </button>
                        ))}
                    </div>

                    {last ? (
                        <>
                            <Link
                                href="/kid"
                                className="press flex w-full items-center justify-center rounded-full border-[3px] border-ink bg-ink p-5 text-[17px] font-extrabold text-white"
                            >
                                Let&apos;s grow!
                            </Link>
                            <Link href="/dashboard" className="min-h-11 text-[15px] font-bold underline underline-offset-4">
                                I&apos;m a parent
                            </Link>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => go(step + 1)}
                            className={cn(
                                'press flex w-full items-center justify-center gap-2 rounded-full border-[3px] border-ink p-5 text-[17px] font-extrabold shadow-hard',
                                current.bg,
                            )}
                        >
                            Next
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                        </button>
                    )}
                </div>
            </section>
        </Phone>
    );
}
