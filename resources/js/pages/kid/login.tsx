import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Mascot } from '@/components/sprout/mascot';
import { Phone } from '@/components/sprout/phone';
import { KidAvatar } from '@/components/sprout/ui';
import { cn } from '@/lib/utils';
import type { KidRef } from '@/types/sprout';

type Props = { kids: Required<KidRef>[]; paired: boolean };

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function KidLogin({ kids, paired }: Props) {
    const [kidId, setKidId] = useState<number | null>(kids.length === 1 ? kids[0].id : null);
    const form = useForm({ kid_id: 0, pin: '' });
    const kid = kids.find((k) => k.id === kidId);

    const press = (key: string) => {
        if (key === '⌫') {
            form.setData('pin', form.data.pin.slice(0, -1));
        } else if (key && form.data.pin.length < 4) {
            form.setData('pin', form.data.pin + key);
        }
    };

    useEffect(() => {
        if (form.data.pin.length === 4 && kidId) {
            form.transform((data) => ({ ...data, kid_id: kidId }));
            form.post('/kid/login', { onError: () => form.setData('pin', '') });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.data.pin]);

    return (
        <Phone bg="bg-sky">
            <Head title="Kid sign in" />
            <div className="flex flex-1 flex-col px-6 pt-6 pb-8">
                <div className="flex items-center justify-between">
                    <Link href="/" className="font-display text-2xl font-extrabold tracking-tight no-underline">
                        sprout
                    </Link>
                </div>

                {!paired ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
                        <Mascot size={150} />
                        <h1 className="font-display text-[30px] leading-tight font-normal [&_b]:font-extrabold">
                            Ask a <b>grown-up</b> to sign in first
                        </h1>
                        <p className="max-w-[280px] font-medium">They only need to do it once on this device. Then you can use your PIN.</p>
                        <Link
                            href="/login"
                            className="press flex min-h-11 w-full items-center justify-center rounded-full border-[3px] border-ink bg-ink p-5 font-extrabold text-white"
                        >
                            Grown-up sign in
                        </Link>
                    </div>
                ) : !kid ? (
                    <div className="flex flex-1 flex-col justify-center gap-6">
                        <h1 className="text-center font-display text-[32px] leading-tight font-normal [&_b]:font-extrabold">
                            Who&apos;s <b>saving</b> today?
                        </h1>
                        <div className="grid grid-cols-2 gap-4">
                            {kids.map((k) => (
                                <button
                                    key={k.id}
                                    type="button"
                                    onClick={() => setKidId(k.id)}
                                    className="press flex flex-col items-center gap-3 rounded-3xl border-[3px] border-ink bg-white p-5 shadow-hard"
                                >
                                    <KidAvatar name={k.name} avatar={k.avatar} size={72} />
                                    <span className="text-lg font-extrabold">{k.name}</span>
                                </button>
                            ))}
                        </div>
                        {kids.length === 0 && <p className="text-center font-semibold">No kids yet. A grown-up can add you in the parent app.</p>}
                    </div>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-between gap-4 pt-4">
                        <div className="flex flex-col items-center gap-3">
                            <KidAvatar name={kid.name} avatar={kid.avatar} size={72} />
                            <h1 className="font-display text-[28px] leading-tight font-normal [&_b]:font-extrabold">
                                Hi <b>{kid.name}</b>, enter your PIN
                            </h1>
                            <div className="flex gap-3" aria-label={`${form.data.pin.length} of 4 digits entered`} role="status">
                                {[0, 1, 2, 3].map((i) => (
                                    <span
                                        key={i}
                                        className={cn(
                                            'size-5 rounded-full border-[3px] border-ink',
                                            i < form.data.pin.length ? 'bg-ink' : 'bg-white',
                                        )}
                                    />
                                ))}
                            </div>
                            <p className="min-h-6 text-sm font-bold" role="alert">
                                {form.errors.pin}
                            </p>
                        </div>

                        <div className="grid w-full max-w-[300px] grid-cols-3 gap-3">
                            {keys.map((key, i) =>
                                key === '' ? (
                                    <span key={i} />
                                ) : (
                                    <button
                                        key={i}
                                        type="button"
                                        disabled={form.processing}
                                        onClick={() => press(key)}
                                        aria-label={key === '⌫' ? 'Delete' : key}
                                        className="press h-16 rounded-2xl border-[3px] border-ink bg-white font-display text-2xl font-extrabold shadow-hard-sm"
                                    >
                                        {key}
                                    </button>
                                ),
                            )}
                        </div>

                        {kids.length > 1 && (
                            <button type="button" onClick={() => setKidId(null)} className="min-h-11 font-bold underline underline-offset-4">
                                Not {kid.name}?
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Phone>
    );
}
