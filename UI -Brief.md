# Sprout: UI/UX brief

Reference: `UI/UX_Example/image.png`, a three-screen savings-app onboarding in a bold neo-brutalist sticker style. This brief turns that reference into rules for Sprout. Take its **style language**. Do not copy its content or its illustrations one for one.

## 1. What the reference does well

| Trait | What it looks like | Why it works for kids 8–12 |
|---|---|---|
| One loud colour per screen | Full-bleed flat green / orange / blue, no gradients | Each step feels like its own "card" or level. It's easy to tell screens apart. |
| Sticker illustrations | One big hero object per screen (piggy bank, trophy, calendar): thick black outline, flat fill, a little offset shadow, burst lines for energy | Reads instantly. It's playful without looking babyish, and it is cheap to draw as SVG. |
| Mixed-weight headlines | "Smart **Savings** Plans Your Way, **Your Pace**": regular and black weights in one centred line | The eye goes to the keyword, so the whole message lands in about 2 seconds. |
| Hard-shadow pills | Outlined pill buttons with a solid black offset shadow (no blur) | Looks physical and "pressable", a strong tap affordance. |
| Minimal chrome | Skip pill at top right, one primary button at the bottom, a short subtitle | One decision per screen. |
| Consistent skeleton | Same layout on every screen: status bar → Skip → hero → headline → subtitle → CTA | Predictable, and it's fast to build as one component with props. |

## 2. How Sprout adopts it

This is already close to the Sprout tokens in `UI/sprout-handoff/CLAUDE.md`: 3 px ink borders, `4px 4px 0 #141414` shadows, flat colours. Push further in these places:

### Onboarding (K1): becomes a 3-step carousel
Same skeleton as the reference. Each step gets one token colour and one sticker hero:

| Step | Background | Hero sticker | Headline (bold words in **bold**) | Subtitle |
|---|---|---|---|---|
| 1 | `leaf` #3DDC5A | Sprout mascot + coin burst | Plant Your Money, **Watch It Grow** | Sprout grows a new leaf every time you save. |
| 2 | `orange` #FF9F4A | Three jars (Spend / Save / Give) | **Split** Every Allowance **Your Way** | Spend some, save some, give some. You choose. |
| 3 | `sky` #8EC5FF | Chat bubble + mascot | Ask **Sprout** Before **You Buy** | Your money buddy helps you think, but you decide. |

- Top right: a `Skip` pill (white, 3 px ink border, 3 px shadow, minimum 44 px tap area).
- Bottom: a full-width `Next →` pill in the **same colour as the background**, with an ink border and a 4 px shadow, like the reference. On the last step it becomes `Let's grow!` (ink fill, white text), with `I'm a parent` as a text link below it.
- Page dots above the CTA: ink filled = current, ink outline = rest.
- Swipe and buttons both work. Respect `prefers-reduced-motion` (fade instead of slide).

### Kid mode (K2–K5): sticker heroes and mixed-weight titles
- Every screen gets **one** hero sticker: the bike on Goal, a trophy or level badge on Level up, the mascot on Coach. Same rules: 3 px ink outline, flat fill, 4 px offset shadow, optional burst lines.
- Screen titles use the mixed-weight pattern: "Saving for a **New Bike**", "You hit **Level 4!**".
- Level up (K5) uses the full-bleed treatment: a `grass` background with the hero centred, like reference screen 2.

### Parent mode (P1–P6): calmer
- Keep the `paper` background. No full-bleed colour floods.
- Borrow only the pill buttons, the hard shadows and the mixed-weight section titles. Stickers stay small (≤ 48 px) as card icons.

## 3. Visual rules

- **Type:** headlines in Bricolage Grotesque, mixing 400 and 800 in the same line; 28–32 px, centred, line-height 1.15. Subtitle in Plus Jakarta Sans 500, 14–15 px, centred, at most 2 lines.
- **Colour:** one dominant colour per kid screen. Ink (#141414) for all outlines and text. Never put white text on `leaf`, `sky` or `orange` (contrast fails); use ink.
- **Stickers:** inline SVG with a 3 px stroke, no gradients. A highlight is just a flat white shape. Hero size is about 45% of screen width.
- **Shadows:** solid ink offsets only: 4 px on cards and CTAs, 3 px on small pills. Never blurred.
- **Pressed state:** the button moves 2 px down-right and the shadow shrinks to 2 px. This gives the reference's "physical" feel.
- **Spacing:** 24 px side gutter. Hero gets the top ~50% of the screen, text block ~30%, CTA pinned 24 px above the home indicator.

## 4. Motion

- Hero sticker: a small pop-in on enter (scale 0.9 → 1, 200 ms, slight overshoot); burst lines fade in after it.
- Carousel: slide 280 ms ease-out.
- Level up: confetti plus a sticker bounce. Everything is off under `prefers-reduced-motion`.

## 5. Accessibility checklist

- Touch targets ≥ 44 px, including Skip.
- Contrast: ink on every bright background (all pass AA); muted #4A4A4A only on white or cream.
- Stickers are decorative: `aria-hidden="true"`. The headline carries the meaning.
- The carousel uses `aria-roledescription="carousel"`, the dots are buttons with labels ("Step 2 of 3"), and focus moves to the headline on step change.

## 6. Don'ts

- Don't copy the reference's piggy bank, trophy or calendar art. Draw Sprout's own stickers.
- Don't use more than one flood colour per screen, and don't use gradients or blurred shadows.
- Don't put more than one primary action on a screen.
- Don't use flood colours in parent mode.


