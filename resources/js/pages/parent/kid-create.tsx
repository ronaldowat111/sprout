import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Phone } from '@/components/sprout/phone';
import { BackLink, KidAvatar } from '@/components/sprout/ui';
import { cn } from '@/lib/utils';

export default function KidCreate({ avatars }: { avatars: string[] }) {
    const form = useForm({ name: '', avatar: avatars[0], pin: '', allowance: '5' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/parent/kids');
    };

    const field = 'min-h-11 rounded-2xl border-[3px] border-ink bg-white px-4 text-base font-semibold';

    return (
        <Phone bg="bg-paper">
            <Head title="Add a kid" />
            <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-5 pt-6 pb-8">
                <div className="flex items-center gap-3">
                    <BackLink href="/dashboard" />
                    <h1 className="font-display text-2xl font-extrabold">Add a kid</h1>
                </div>

                <p className="text-sm font-semibold text-ink-muted">
                    Sprout only keeps a first name and a colour. Your kid signs in with a 4-digit PIN under your account and never sees PayPal.
                </p>

                <label className="flex flex-col gap-1.5 text-sm font-extrabold">
                    First name
                    <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} maxLength={30} className={field} />
                    {form.errors.name && <span className="text-xs">{form.errors.name}</span>}
                </label>

                <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1.5 text-sm font-extrabold">Colour</legend>
                    <div className="flex gap-3">
                        {avatars.map((a) => (
                            <label key={a} className="cursor-pointer">
                                <input
                                    type="radio"
                                    name="avatar"
                                    value={a}
                                    checked={form.data.avatar === a}
                                    onChange={() => form.setData('avatar', a)}
                                    className="peer sr-only"
                                />
                                <span className={cn('block rounded-full p-1 peer-checked:ring-[3px] peer-checked:ring-ink peer-focus-visible:outline-3')}>
                                    <KidAvatar name={form.data.name || '?'} avatar={a} size={48} />
                                </span>
                                <span className="sr-only">{a}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5 text-sm font-extrabold">
                        4-digit PIN
                        <input
                            value={form.data.pin}
                            onChange={(e) => form.setData('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                            inputMode="numeric"
                            autoComplete="off"
                            className={field}
                        />
                        {form.errors.pin && <span className="text-xs">{form.errors.pin}</span>}
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-extrabold">
                        Weekly allowance ($)
                        <input value={form.data.allowance} onChange={(e) => form.setData('allowance', e.target.value)} inputMode="decimal" className={field} />
                        {form.errors.allowance && <span className="text-xs">{form.errors.allowance}</span>}
                    </label>
                </div>

                <button type="submit" disabled={form.processing} className="press mt-auto min-h-11 rounded-full border-[3px] border-ink bg-ink p-[18px] font-extrabold text-white">
                    Add kid
                </button>
            </form>
        </Phone>
    );
}
