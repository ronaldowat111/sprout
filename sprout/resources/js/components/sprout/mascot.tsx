type MascotProps = {
    size?: number;
    /** 1–5: grows extra leaves, then a bud, then a flower. */
    stage?: number;
    mood?: 'happy' | 'celebrate';
    className?: string;
};

/** Sprout, the money buddy. Ported from the design SVG (Main.dc.html / Streak.dc.html). */
export function Mascot({ size = 190, stage = 3, mood = 'happy', className }: MascotProps) {
    const height = Math.round(size * 1.2);

    return (
        <svg width={size} height={height} viewBox="0 0 200 240" aria-hidden="true" className={className}>
            <g transform="translate(0 20)">
                <path d="M100 72 L100 30" stroke="#141414" strokeWidth="6" strokeLinecap="round" />
                {stage >= 2 && (
                    <path
                        d="M100 52 C82 28 54 28 44 42 C58 60 86 62 100 52 Z"
                        fill="#3DDC5A"
                        stroke="#141414"
                        strokeWidth="5"
                        strokeLinejoin="round"
                    />
                )}
                <path
                    d="M100 46 C116 18 150 16 160 32 C146 52 118 56 100 46 Z"
                    fill="#3DDC5A"
                    stroke="#141414"
                    strokeWidth="5"
                    strokeLinejoin="round"
                />
                {stage >= 3 && (
                    <path
                        d="M100 36 C86 18 66 16 58 24 C68 38 88 42 100 36 Z"
                        fill="#9BEA7A"
                        stroke="#141414"
                        strokeWidth="5"
                        strokeLinejoin="round"
                    />
                )}
                {stage === 4 && <circle cx="100" cy="18" r="9" fill="#FF8FB1" stroke="#141414" strokeWidth="5" />}
                {stage >= 5 && (
                    <>
                        <circle cx="100" cy="14" r="12" fill="#FF8FB1" stroke="#141414" strokeWidth="5" />
                        <circle cx="100" cy="14" r="4" fill="#FFC93C" />
                    </>
                )}
                <path
                    d="M100 68 C150 68 178 106 178 148 C178 192 146 214 100 214 C54 214 22 192 22 148 C22 106 50 68 100 68 Z"
                    fill="#FFC93C"
                    stroke="#141414"
                    strokeWidth="5"
                />
                <path
                    d="M58 100 C66 88 80 81 94 80"
                    stroke="#FFFFFF"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.75"
                />
                {mood === 'celebrate' ? (
                    <>
                        <path d="M62 136 Q76 120 90 136" stroke="#141414" strokeWidth="6" strokeLinecap="round" fill="none" />
                        <path d="M110 136 Q124 120 138 136" stroke="#141414" strokeWidth="6" strokeLinecap="round" fill="none" />
                        <path d="M24 150 C8 140 6 120 14 112" stroke="#141414" strokeWidth="6" strokeLinecap="round" fill="none" />
                        <path d="M176 150 C192 140 194 120 186 112" stroke="#141414" strokeWidth="6" strokeLinecap="round" fill="none" />
                    </>
                ) : (
                    <>
                        <circle cx="76" cy="136" r="17" fill="#FFFFFF" stroke="#141414" strokeWidth="4" />
                        <circle cx="79" cy="139" r="9" fill="#141414" />
                        <circle cx="83" cy="134" r="3.5" fill="#FFFFFF" />
                        <circle cx="124" cy="136" r="17" fill="#FFFFFF" stroke="#141414" strokeWidth="4" />
                        <circle cx="127" cy="139" r="9" fill="#141414" />
                        <circle cx="131" cy="134" r="3.5" fill="#FFFFFF" />
                    </>
                )}
                <ellipse cx="56" cy="164" rx="11" ry="7" fill="#FF8FB1" />
                <ellipse cx="144" cy="164" rx="11" ry="7" fill="#FF8FB1" />
                <path
                    d="M86 162 Q100 184 114 162 Q100 168 86 162 Z"
                    fill="#141414"
                    stroke="#141414"
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
            </g>
        </svg>
    );
}

/** Small round mascot face used as the coach avatar. */
export function MascotBadge({ size = 48, className }: { size?: number; className?: string }) {
    return (
        <div
            className={`flex flex-none items-end justify-center overflow-hidden rounded-full border-[3px] border-ink bg-white ${className ?? ''}`}
            style={{ width: size, height: size }}
        >
            <svg width={size * 0.83} height={size * 0.92} viewBox="0 0 200 220" aria-hidden="true">
                <path d="M100 72 L100 40" stroke="#141414" strokeWidth="8" strokeLinecap="round" />
                <path d="M100 46 C82 22 54 22 44 36 C58 54 86 56 100 46 Z" fill="#3DDC5A" stroke="#141414" strokeWidth="7" />
                <path d="M100 40 C116 12 150 10 160 26 C146 46 118 50 100 40 Z" fill="#3DDC5A" stroke="#141414" strokeWidth="7" />
                <path
                    d="M100 68 C150 68 178 106 178 148 C178 192 146 214 100 214 C54 214 22 192 22 148 C22 106 50 68 100 68 Z"
                    fill="#FFC93C"
                    stroke="#141414"
                    strokeWidth="7"
                />
                <circle cx="78" cy="138" r="11" fill="#141414" />
                <circle cx="122" cy="138" r="11" fill="#141414" />
                <path d="M86 162 Q100 184 114 162 Z" fill="#141414" />
            </svg>
        </div>
    );
}

export function Coin({ size = 40, className }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true" className={className}>
            <circle cx="22" cy="22" r="19" fill="#FFC93C" stroke="#141414" strokeWidth="3" />
            <text
                x="22"
                y="29.5"
                textAnchor="middle"
                fontFamily="Bricolage Grotesque, sans-serif"
                fontWeight="800"
                fontSize="20"
                fill="#141414"
            >
                $
            </text>
        </svg>
    );
}

/** Short burst lines around a hero sticker (from the UI brief reference). */
export function Burst({ size = 220, className }: { size?: number; className?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 220 220" aria-hidden="true" className={className}>
            <g stroke="#141414" strokeWidth="6" strokeLinecap="round">
                <path d="M110 14 V34" />
                <path d="M46 40 L60 54" />
                <path d="M174 40 L160 54" />
                <path d="M16 106 H36" />
                <path d="M204 106 H184" />
            </g>
        </svg>
    );
}
