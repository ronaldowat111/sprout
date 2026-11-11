# Sprout

Kids allowance wallet + AI money coach. PayPal AI Hackathon entry.

## Sources of truth, in order

1. `Sprout — Project Brief.md`: product, money model, stack, data model, PayPal flow, AI coach. It wins any conflict.
2. `UI -Brief.md`: visual style.
3. `UI/sprout-handoff/CLAUDE.md`: design tokens, the 11 screens and how they map to Inertia pages.

## Code

The app lives in `sprout/` (Laravel 13 + Inertia React + TypeScript + Tailwind 4, SQLite). Run every command from `sprout/`.

- Test: `php artisan test`. Type-check: `npx tsc --noEmit`. Build: `npm run build`. Format PHP: `vendor/bin/pint`.
- Reset demo data: `php artisan migrate:fresh --seed`.

Rules that must stay true:

- A kid's balance is the sum of their transactions. Only `LedgerService` writes transactions.
- The AI coach (`CoachAgent` + `CoachTools`) has no payment tool. Its strongest action is a purchase request.
- The ledger records a purchase only after PayPal reports `COMPLETED`.
- Parents see summaries of kid chats, never the raw chats.
- Money is integer cents everywhere; format only in the UI.
