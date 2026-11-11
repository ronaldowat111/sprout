import { Link } from '@inertiajs/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'leaf' | 'sun' | 'orange' | 'sky' | 'pink';

const variants: Record<Variant, string> = {
    primary: 'bg-ink text-white',
    secondary: 'bg-white text-ink shadow-hard-sm',
    leaf: 'bg-leaf text-ink shadow-hard',
    sun: 'bg-sun text-ink shadow-hard',
    orange: 'bg-orange text-ink shadow-hard',
    sky: 'bg-sky text-ink shadow-hard',
    pink: 'bg-pink text-ink shadow-hard',
};

const pillBase =
    'press inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[3px] border-ink px-5 py-3 text-center font-body text-base font-extrabold no-underline disabled:cursor-not-allowed disabled:opacity-50';

export function PillButton({
    variant = 'primary',
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
    return <button type="button" className={cn(pillBase, variants[variant], className)} {...props} />;
}

export function PillLink({
    href,
    variant = 'primary',
    className,
    children,
    method,
    as,
}: {
    href: string;
    variant?: Variant;
    className?: string;
    children: ReactNode;
    method?: 'post';
    as?: 'button';
}) {
    return (
        <Link href={href} method={method} as={as} className={cn(pillBase, variants[variant], className)}>
            {children}
        </Link>
    );
}

export function BackLink({ href, label = 'Back' }: { href: string; label?: string }) {
    return (
        <Link
            href={href}
            aria-label={label}
            className="press flex size-11 flex-none items-center justify-center rounded-full border-[3px] border-ink bg-white shadow-hard-sm"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
            </svg>
        </Link>
    );
}

export function Card({ className, children, shadow = true }: { className?: string; children: ReactNode; shadow?: boolean }) {
    return (
        <div className={cn('rounded-3xl border-[3px] border-ink bg-white p-4', shadow && 'shadow-hard', className)}>
            {children}
        </div>
    );
}

export function ProgressBar({
    value,
    label,
    className,
    fill = 'bg-ink',
    track = 'bg-white',
}: {
    value: number;
    label: string;
    className?: string;
    fill?: string;
    track?: string;
}) {
    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={100}
            className={cn('h-3 overflow-hidden rounded-full border-[2.5px] border-ink', track, className)}
        >
            <div className={cn('h-full rounded-full transition-[width] duration-500', fill)} style={{ width: `${value}%` }} />
        </div>
    );
}

const avatarColors: Record<string, string> = {
    pink: 'bg-pink',
    sun: 'bg-sun',
    sky: 'bg-sky',
    orange: 'bg-orange',
    leaf: 'bg-leaf',
};

export function KidAvatar({ name, avatar, size = 44 }: { name: string; avatar: string; size?: number }) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                'flex flex-none items-center justify-center rounded-full border-[3px] border-ink font-display font-extrabold',
                avatarColors[avatar] ?? 'bg-pink',
            )}
            style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
        >
            {name.charAt(0)}
        </div>
    );
}

export function avatarBg(avatar: string): string {
    return avatarColors[avatar] ?? 'bg-pink';
}

/** "Saving for a **New Bike**" style headline: wrap the loud words in <b>. */
export function MixedTitle({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <h1 className={cn('font-display text-[30px] leading-[1.12] font-normal tracking-tight [&_b]:font-extrabold', className)}>
            {children}
        </h1>
    );
}

export function Sparkle({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none">
            <path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" />
            <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
        </svg>
    );
}

export function Shield({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-none">
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    );
}
