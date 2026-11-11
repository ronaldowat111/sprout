# Sprout — Project Brief

Nov 11, 2026 · @tam

## The idea

**Sprout is an allowance wallet for kids aged 8–12 with an AI money coach that slows spending down — and real money moves through PayPal only after a parent approves.** The name: a kid's money grows a little every week, the way a sprout does.

**Problem.** Kids learn about money by spending it, but most kids' finance apps are just debit cards with parental limits. They control spending; they don't teach the thinking before it. Parents want their kids to practise saving, wanting vs needing, and waiting — without handing them a payment account.

**Why now.** AI agents are starting to buy things for people. Sprout shows the opposite side of agentic commerce: an agent whose job is to help a kid decide *whether* to buy, and which is structurally unable to spend money on its own.

## How it works

&#91;embedded content: Sprout flow · kid side, parent side, one approval gate\]

The kid earns virtual credit, talks a purchase through with the coach and saves toward it; only when a parent approves does PayPal move real money. A rejected request sends the kid back to saving.

## Key design decisions

- **The kid's balance is virtual credit, not stored money.** The app holds no funds, so it needs no e-money licence. Real money leaves the parent's PayPal account only when an approved purchase is paid.
- **The parent owns the PayPal account.** PayPal requires account holders to be 18+, so kids never touch PayPal directly. Kids sign in with a 4-digit PIN under the parent's account.
- **The AI cannot spend.** The coach has no payment tool. Its strongest action is creating a purchase request, which a parent must approve and pay through PayPal. This is the core trust claim of the pitch.
- **Balance is derived, never stored.** Balance = sum of the kid's transactions, so it can't drift out of sync.

## Feature scope

The demo needs the seven MVP features; stretch features each target a sponsor prize.

| Priority | Feature | What it does |
| --- | --- | --- |
| MVP | Parent account + kid profiles | Parent signs up, creates kid profiles; kid signs in with a PIN |
| MVP | Allowance | Weekly allowance amount; a "Give allowance now" button for the demo |
| MVP | Chores | Parent posts chores with a reward; kid marks done; parent approves; balance goes up |
| MVP | AI coach chat (kid) | Checks balance, sets savings goals, estimates weeks to goal, suggests chores, drafts purchase requests |
| MVP | Savings goals | Visual progress bar per goal |
| MVP | Purchase approval (parent) | Request shows the kid's reason + AI summary; parent pays with PayPal; balance drops; status becomes Bought |
| MVP | Transaction history | Ledger of allowance, chores and purchases |
| Stretch | AI weekly report (parent) | e.g. "Rafi saved 60% this week" — cheap to build, strong with judges |
| Stretch | Real product wishlist | Channel3 API product search for goals (Channel3 prize) |
| Stretch | History grid | AG Grid for the transaction table (AG Grid prize) |
| Stretch | Hosting | Deploy on Render (Render credits prize) |

**Out of scope:** debit cards, kid-to-kid transfers, real-time notifications, investing, multi-currency.

## Tech stack and data model

**Stack:** Laravel + Inertia (React), SQLite, PayPal Orders v2 (sandbox) with the PayPal JS SDK buttons, an LLM with tool calling for the coach.

```
sprout/
├── app/
│   ├── Models/          User (parent), Kid, Chore, Goal, Transaction, PurchaseRequest, ChatMessage
│   ├── Http/Controllers/
│   │   ├── KidController.php
│   │   ├── ChoreController.php
│   │   ├── CoachController.php          ← AI chat endpoint
│   │   ├── PurchaseRequestController.php
│   │   └── PayPalController.php         ← create-order, capture-order
│   └── Services/
│       ├── PayPalService.php            ← OAuth token + Orders v2
│       ├── CoachAgent.php               ← LLM loop + tool calling
│       └── LedgerService.php            ← balance from transactions
├── resources/js/Pages/
│   ├── Parent/  Dashboard, Kids, Chores, Approvals, Reports
│   └── Kid/     Home, Coach, Chores
└── database/migrations/
```

| Table | Key columns |
| --- | --- |
| kids | parent\_id, name, avatar, pin\_hash, weekly\_allowance |
| transactions | kid\_id, type (allowance / chore / purchase), amount (+/−), note |
| chores | kid\_id, title, reward, status (todo / done / approved) |
| goals | kid\_id, title, target\_amount, product\_url (optional) |
| purchase\_requests | kid\_id, goal\_id, item, amount, kid\_reason, ai\_summary, status (pending / approved / paid / rejected), paypal\_order\_id |
| chat\_messages | kid\_id, role, content |

## PayPal integration

PayPal runs at the moment that matters: the parent paying for an approved purchase.

1. Create an app at developer.paypal.com; take the sandbox Client ID + Secret. Use a sandbox buyer account as the parent.
2. Frontend: PayPal JS SDK buttons on the parent's Approvals page.
3. `POST /paypal/orders` → server calls `POST /v2/checkout/orders` (intent `CAPTURE`, amount from the purchase request) and stores `paypal_order_id`.
4. Parent approves in the PayPal popup → `POST /paypal/orders/{id}/capture` → server captures.
5. On status `COMPLETED`: write a purchase transaction (−amount) and set the request to `paid`.

## AI coach

The coach gets six tools and deliberately no payment tool.

| Tool | Purpose |
| --- | --- |
| `get_balance()` | Current virtual balance |
| `list_goals()` | Active savings goals + progress |
| `create_goal(title, target_amount)` | New savings goal |
| `weeks_to_goal(goal_id)` | Estimate from balance, allowance and average chore earnings |
| `suggest_chores()` | Open chores that would speed up a goal |
| `create_purchase_request(item, amount, reason)` | Sends a request to the parent for approval |

**System prompt core:**

```
You are a friendly money buddy for a kid aged 8–12.
Use short, warm sentences and simple words.
Never just say "buy it". Help the kid think first: is it a need or a want?
How long would saving for it take? Is there a cheaper option?
You cannot spend money. Every purchase must be approved by a parent.
When the kid is ready, offer to send a purchase request with their reason.
```

## Build plan

Submissions close Nov 12, 12:00 PM PT (Fri Nov 13, 03:00 WIB); the target is to submit by 01:00 WIB for a 2-hour buffer. Hours count from the start of the build.

1. **Hours 0–2:** `laravel new` + Breeze (React/Inertia) + SQLite; migrations; seed one parent + one kid.
2. **Hours 2–5:** LedgerService, allowance, chores (simple CRUD).
3. **Hours 5–9:** PayPalService + Approvals page; get a sandbox capture working end to end.
4. **Hours 9–14:** CoachAgent + kid chat UI + tool calling.
5. **Hours 14–17:** Goals + progress bars; polish the kid UI (bright colours, avatars).
6. **Hours 17–19:** AI weekly report for parents; AG Grid history (optional).
7. **Hours 19–21:** Deploy to Render; seed convincing demo data.
8. **Hours 21–24:** Record the demo (split screen: kid phone left, parent phone right); write the Devpost page.
9. **Hours 24–27:** Buffer, then submit.

## Pitch and prize fit

The headline: **most AI agents in this hackathon will help people buy faster; Sprout's agent helps kids decide whether to buy at all.**

| Prize | Angle |
| --- | --- |
| Most Impactful | Financial literacy for kids aged 8–12, an age group supervised teen accounts don't cover |
| Best Use of Agentic Commerce | A safe agent: it can request, never spend; a human adult approves every payment |
| Best Use of PayPal + AI | PayPal handles the real money at approval; AI handles the thinking before it. Neither works alone |
| Best Demo Delivery | Story arc: kid wants a $30 Lego, saves for 6 weeks, parent approves, PayPal pays |
| Sponsor prizes | Channel3 (wishlist), AG Grid (history), Render (hosting) |

**Required Devpost line:** "PayPal moves the money when a parent approves a purchase; the AI coach helps the kid save and decide, and cannot spend without that approval."

**Privacy note for the Devpost page:** accounts are created and managed by parents; kids sign in with a PIN under the parent's account; the app collects only a first name and avatar for each kid and holds no funds.
