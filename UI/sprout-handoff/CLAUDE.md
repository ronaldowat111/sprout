# Sprout: kids allowance wallet + AI money coach

PayPal AI Hackathon (Devpost) entry. **`../../Sprout — Project Brief.md` is the source of truth** for product, money model, stack, data model, PayPal flow, AI coach and build plan. If anything here disagrees with it, the project brief wins. This file only covers how to turn the designs into UI.

The goal is a **demo-ready MVP**: the flows look and feel like the design and run end to end.

## Ground rules from the project brief (don't break these)

- The kid's balance is **virtual credit**, worked out from the `transactions` table. It is never stored as a column.
- The parent owns the PayPal account. Kids never touch PayPal and sign in with a 4-digit PIN.
- **The AI coach cannot spend.** It has no payment tool. Its strongest action is `create_purchase_request`.
- PayPal (Orders v2, sandbox) runs only when a parent pays for an approved purchase request.

## Source of truth for the UI

- `*.dc.html` in this folder: the approved screens. They're plain HTML with inline styles: read them for exact layout, colours, sizes and SVGs (mascot, icons, illustrations). Ignore `<x-dc>`, `<helmet>`, the `support.js` script and the `text/x-dc` script block. Port the markup into React components (Inertia pages).
- `../../UI -Brief.md`: the UI/UX style brief (sticker heroes, full-bleed kid screens, mixed-weight headlines).
- `ref-*.png`: mood references only. Do **not** copy the bear character or the reference's illustrations.

The copy and numbers inside the designs are placeholders. Use the demo data from the project brief.

| File | Screen | Inertia page |
|---|---|---|
| Main.dc.html | K1 Onboarding + PIN sign-in | `Welcome`, `Kid/Login` |
| Home.dc.html | K2 Kid home (balance, goal, chores) | `Kid/Home` |
| Goal.dc.html | K3 Savings goal | `Kid/Goal` |
| Coach.dc.html | K4 AI coach chat | `Kid/Coach` |
| Streak.dc.html | K5 Goal reached / level up | `Kid/LevelUp` |
| ParentHome.dc.html | P1 Parent dashboard | `Parent/Dashboard` |
| Parent.dc.html | P2 Kid detail + transaction history | `Parent/Kids` |
| Allowance.dc.html | P3 Allowance settings | `Parent/Kids` (settings section) |
| Chores.dc.html | P4 Chores | `Parent/Chores` |
| Insights.dc.html | P5 AI weekly report (stretch) | `Parent/Reports` |
| TopUp.dc.html | P6 → **Approvals + PayPal checkout** | `Parent/Approvals` |

Design adjustments the project brief forces:
- **Jars:** the brief has one balance. Show Spend / Save / Give jars only as optional display; don't build jar logic.
- **P6:** there is no wallet top-up. Reuse its layout for the purchase request (item, amount, kid's reason, AI summary) with the PayPal JS SDK buttons in place of the top-up button.
- **K4 coach:** keep the chat bubble and choice-card look. The choices come from the agent's tool results (weeks to goal, suggested chores, "send request to parent").

## Design tokens

```
ink        #141414   text, outlines, primary buttons
sky        #8EC5FF   kid sky background, header
sky-50     #DCEBFF   chat background, chips
grass      #5BD16A   hills, level-up background
leaf       #3DDC5A   active nav, positive cards, mascot leaves
leaf-dark  #2E9A47   allowance pill (white text OK)
sun        #FFC93C   mascot body, coins, highlights
orange     #FF9F4A   goal card
spend      #FF8A3D   purchases
pink       #FF8FB1   cheeks, requests
give       #E85D9A   accent
cream      #FFF6E5   kid sheet background
paper      #F4F1EA   parent background
line       #EAE5DA   dividers
muted      #4A4A4A   secondary text (passes 4.5:1 on white)
```

- Fonts (Google): **Bricolage Grotesque** 700/800 for headings and big numbers; **Plus Jakarta Sans** 400–800 for everything else.
- Signature style: 3 px `ink` borders, hard offset shadow `4px 4px 0 #141414` (3px on small elements), radius 18–28 px on cards and 999 px on pills and buttons. Flat colours, no gradients.
- Primary button: ink background, white 800-weight text, full pill. Secondary: white with an ink border.
- Kid mode is loud (sky, hills, mascot). Parent mode is calmer (paper background, fewer colours) but uses the same component language.
- Frame the app at 390 px wide, centred on desktop, so the demo looks like a phone (split-screen recording: kid left, parent right).
- Accessibility: real `<button>`/`<a>`, `aria-label` on icon buttons, 44 px minimum touch targets, keep the contrast pairs from the design.

## Components to build first

`Mascot` (SVG from the design; props: `size`, `stage` 1–5 adds leaves/flower, `mood` happy|celebrate), `Coin`, `Card`, `PillButton`, `IconButton`, `ProgressBar`, `ChatBubble` (kid/coach), `ChoiceCard`, `Toggle`, `BottomNav` (kid and parent variants), `RequestCard`, `ChoreCard`, `PinPad`.

## Conventions

- Match the design closely at 390 px; don't invent new visual styles.
- Money as integer cents in the database; format at the edge.
- Keep copy in English (Devpost submission).
- Keys (PayPal, LLM) go in `.env`. Never hard-code them, never call the LLM from the browser.
- Commit after each build-plan step with a clear message.
