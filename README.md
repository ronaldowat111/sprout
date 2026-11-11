# Sprout

An allowance wallet for kids aged 8–12 with an AI money coach that slows spending down. Real money moves through PayPal only after a parent approves.

Built for the PayPal AI Hackathon on Devpost.

> PayPal moves the money when a parent approves a purchase; the AI coach helps the kid save and decide, and cannot spend without that approval.

## What's in this repo

This repo is the product scaffold: the briefs that define Sprout, the approved designs, and the working app built from them.

| Path | What it is | Role |
|---|---|---|
| [`Sprout — Project Brief.md`](./Sprout%20—%20Project%20Brief.md) | Product, money model, stack, data model, PayPal flow, AI coach, build plan | **Source of truth.** Wins any conflict. |
| [`UI -Brief.md`](./UI%20-Brief.md) | Visual style: sticker heroes, full-bleed kid screens, mixed-weight headlines | Look and feel |
| [`UI/sprout-handoff/`](./UI/sprout-handoff) | 11 approved screens (`*.dc.html`), design tokens and screen-to-page map in `CLAUDE.md` | Design handoff |
| [`sprout/`](./sprout) | The Laravel + Inertia (React) app | The product |

The mood-reference images the UI brief mentions (`UI/UX_Example/`, `UI/sprout-handoff/ref-*.png`) are third-party artwork. They're kept locally and are not in this repo.

## Run the app

```bash
cd sprout
composer install && npm install
cp .env.example .env && php artisan key:generate
php artisan migrate:fresh --seed
composer run dev   # http://localhost:8000
```

Parent login: `dina@sprout.test` / `password`. Kids: Rafi or Maya, PIN `1234`.

See [`sprout/README.md`](./sprout/README.md) for API keys, the demo story and how it works.

## Building on the scaffold

1. Product changes start in the project brief.
2. Visual changes follow the UI brief and the tokens in `UI/sprout-handoff/CLAUDE.md`.
3. Code goes in `sprout/`. Run `php artisan test` before committing.
