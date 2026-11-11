import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PhoneProps = {
    children: ReactNode;
    /** Tailwind background class for the screen, e.g. "bg-sky". */
    bg?: string;
    /** Rendered above the content, pinned to the bottom (bottom nav, sticky CTA). */
    footer?: ReactNode;
    className?: string;
};

/**
 * The demo is recorded as two phones side by side, so on desktop every Sprout
 * screen sits in a 390 × 844 frame. On a real phone it fills the viewport.
 */
export function Phone({ children, bg = 'bg-cream', footer, className }: PhoneProps) {
    return (
        <div className="sprout flex min-h-dvh items-center justify-center bg-[#E9E4D8] font-body text-ink sm:py-8">
            <div
                className={cn(
                    'relative flex h-dvh w-full flex-col overflow-hidden sm:h-[844px] sm:w-[390px] sm:rounded-[44px] sm:border-[3px] sm:border-ink sm:shadow-[8px_8px_0_#141414]',
                    bg,
                )}
            >
                <div className={cn('relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto', className)}>{children}</div>
                {footer}
            </div>
        </div>
    );
}
