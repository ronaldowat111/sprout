/** Money is stored as integer cents everywhere; format only at the edge. */
export function money(cents: number, opts: { whole?: boolean } = {}): string {
    const sign = cents < 0 ? '−' : '';
    const abs = Math.abs(cents);

    if (opts.whole && abs % 100 === 0) {
        return `${sign}$${abs / 100}`;
    }

    return `${sign}$${(abs / 100).toFixed(2)}`;
}

export function percent(part: number, whole: number): number {
    if (whole <= 0) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}
