# Sprout

An allowance wallet for kids aged 8–12 with an AI money coach that slows spending down. Real money moves through PayPal only after a parent approves.

PayPal moves the money when a parent approves a purchase; the AI coach helps the kid save and decide, and cannot spend without that approval.

## Run it

Needs PHP 8.3+, Composer and Node 20+.

```bash
composer install
npm install
cp .env.example .env        # skip if .env exists
php artisan key:generate    # skip if APP_KEY is set
php artisan migrate:fresh --seed
composer run dev            # http://localhost:8000
```

Demo logins (from the seeder):

| Who | How |
|---|---|
| Parent | `dina@sprout.test` / `password` |
| Kids | Rafi or Maya, PIN `1234` (a parent must sign in once on the device first) |

Reset the demo at any time with `php artisan migrate:fresh --seed`.

### Keys (optional)

Add these to `.env`. Without them the app still runs end to end:

- `ANTHROPIC_API_KEY`: the coach runs on Claude (`claude-opus-5-5`) with tool calling. Without a key a simple rule-based coach answers, using the same tools and numbers.
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`: sandbox credentials from developer.paypal.com. Without them, the Approvals page shows a **Simulate PayPal payment** button (local only).

## Demo story

1. Rafi has $23 saved toward a $30 Lego set.
2. Rafi marks "Feed the cat" done. Dina approves it on **Chores** (+$2).
3. Dina taps **Give $5 now** on Rafi's wallet. Rafi reaches $30.
4. Rafi asks Sprout or opens the goal screen. "Goal reached" lets him ask Dina to buy it.
5. Dina opens **Approvals**, reads Sprout's summary and pays with PayPal. Rafi's balance drops to $0 and the goal is marked bought.
6. **Reports** shows the week: money in and out, topics practised, a proud moment and a dinner question. Parents get summaries, never the raw chats.

Record it split-screen: kid window on the left, parent window on the right. Both can share one browser.

## How it works

- **Balance is derived, never stored.** `LedgerService` sums a kid's transactions. It is the only place that writes them.
- **The AI cannot spend.** `CoachTools` has six tools (`get_balance`, `list_goals`, `create_goal`, `weeks_to_goal`, `suggest_chores`, `create_purchase_request`) plus `show_choices` for reply buttons. None of them moves money. All the maths is done in code.
- **PayPal runs at approval.** `PayPalService` creates an Orders v2 order and captures it. The ledger is written only after PayPal reports `COMPLETED`.
- **Kids have no account.** They pick their name and enter a PIN under the parent's account on a device the parent has signed in on.

## Tests

```bash
php artisan test
```

`tests/Feature/SproutFlowTest.php` covers the full demo story with PayPal faked, PIN sign-in, family isolation and the "no money without capture" rule.
