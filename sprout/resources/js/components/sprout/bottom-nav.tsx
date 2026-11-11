import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Item = { href: string; label: string; key: string; icon: ReactNode };

const stroke = {
    fill: 'none',
    stroke: '#141414',
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
};

const icons = {
    home: (
        <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
            <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </svg>
    ),
    goal: (
        <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1" />
        </svg>
    ),
    coach: (
        <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
            <path d="M9 11h.01M12 11h.01M15 11h.01" />
        </svg>
    ),
    chores: (
        <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
            <path d="M9 11l3 3 8-8" />
            <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
        </svg>
    ),
    approvals: (
        <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10h18M7 15h4" />
        </svg>
    ),
    reports: (
        <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
    ),
};

const kidItems: Item[] = [
    { key: 'home', href: '/kid', label: 'Home', icon: icons.home },
    { key: 'goal', href: '/kid/goal', label: 'My goal', icon: icons.goal },
    { key: 'coach', href: '/kid/coach', label: 'Ask Sprout', icon: icons.coach },
    { key: 'chores', href: '/kid/chores', label: 'Chores', icon: icons.chores },
];

const parentItems: Item[] = [
    { key: 'home', href: '/dashboard', label: 'Home', icon: icons.home },
    { key: 'approvals', href: '/parent/approvals', label: 'Approvals', icon: icons.approvals },
    { key: 'chores', href: '/parent/chores', label: 'Chores', icon: icons.chores },
    { key: 'reports', href: '/parent/reports', label: 'Reports', icon: icons.reports },
];

export function BottomNav({ variant, active, badges = {} }: { variant: 'kid' | 'parent'; active: string; badges?: Record<string, number> }) {
    const items = variant === 'kid' ? kidItems : parentItems;

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-5">
            <nav
                aria-label={variant === 'kid' ? 'Main' : 'Parent'}
                className="pointer-events-auto flex gap-1.5 rounded-full border-[3px] border-ink bg-white p-2 shadow-hard"
            >
                {items.map((item) => {
                    const badge = badges[item.key] ?? 0;

                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            aria-label={badge > 0 ? `${item.label}, ${badge} waiting` : item.label}
                            aria-current={active === item.key ? 'page' : undefined}
                            className={cn(
                                'relative flex h-12 w-[52px] items-center justify-center rounded-full',
                                active === item.key && 'border-[2.5px] border-ink bg-leaf',
                            )}
                        >
                            {item.icon}
                            {badge > 0 && (
                                <span className="absolute -top-1.5 -right-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-[2.5px] border-ink bg-pink px-1 text-[11px] font-extrabold">
                                    {badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
