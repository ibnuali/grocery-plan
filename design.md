# Design — Grocery

A locked design system for this app. Every page reads this file before emitting
code. Do not regenerate per page — extend or amend this file when the system
needs to grow.

`Hallmark · genre: modern-minimal · design-system: design.md · designed-as-app`

## Genre

modern-minimal. A utility app (grocery planning + price tracking) with a small
marketing front door for signed-out visitors. Restraint with conviction: flat
paper, hairline structure, one confident accent, function before decoration.

## Macrostructure families

- **Marketing pages** (signed-out home): **Marquee Hero** — a solid, confident
  headline carries the fold; supporting list + how-it-works below. No gradient
  text, no hero CTA stack floating in whitespace.
- **App pages** (authenticated home, categories, items, lists, list detail):
  **Workbench** — a compact page head (title + primary action), then hairline
  bordered rows/grid. Function-first. No enrichment, no illustration.
- **Auth pages** (login, signup): a two-panel split — a **solid** brand panel
  (ink field, one accent hairline) beside a clean form. No blurred blobs.

## Theme

Flat, near-monochrome, one produce-green accent held to ~5% of any viewport.

| Token | Light | Dark |
| --- | --- | --- |
| `--color-paper` | `oklch(0.992 0.005 130)` | `oklch(0.205 0.013 160)` |
| `--color-paper-2` | `oklch(0.972 0.007 135)` | `oklch(0.245 0.015 160)` |
| `--color-paper-3` | `oklch(0.945 0.010 140)` | `oklch(0.285 0.018 160)` |
| `--color-ink` | `oklch(0.265 0.020 158)` | `oklch(0.955 0.008 150)` |
| `--color-ink-2` | `oklch(0.520 0.018 152)` | `oklch(0.720 0.018 150)` |
| `--color-rule` | `oklch(0.900 0.010 150)` | `oklch(0.320 0.018 155)` |
| `--color-accent` | `oklch(0.560 0.130 150)` | `oklch(0.720 0.125 152)` |
| `--color-accent-strong` | `oklch(0.500 0.130 150)` | `oklch(0.780 0.120 152)` |
| `--color-accent-ink` | `oklch(0.992 0.010 150)` | `oklch(0.180 0.020 160)` |
| `--color-danger` | `oklch(0.552 0.190 25)` | `oklch(0.680 0.180 25)` |
| `--color-focus` | `oklch(0.560 0.130 150)` | `oklch(0.720 0.125 152)` |

Accent placement: primary buttons, the active nav underline, the focus ring, and
at most one icon accent per view. Never a gradient, never a flood.

## Typography

- **Display:** Fraunces, weight 500/700, roman only (never italic headers).
- **Body:** Manrope, weight 400–700.
- **Display tracking:** `-0.01em`.
- **Type scale anchor:** `--text-display` = `clamp(2.5rem, 6vw + 0.5rem, 4.5rem)`.
- Tabular numerals (`font-variant-numeric: tabular-nums`) on every price and count.

## Spacing

4-point named scale, in `tokens.css`. Pages use named tokens or the matching
Tailwind spacing utilities — never raw one-off values.

## Motion

- Easing: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`.
- Reveal: one `rise-in` entrance (opacity + 10px translate) on first paint only.
- `prefers-reduced-motion: reduce` collapses reveals to an opacity crossfade ≤150ms.
- Animate `transform` / `opacity` only. Focus rings appear instantly.

## Microinteractions stance

- Silent success — no celebratory toasts. Inline error blocks for failures.
- Card hover: border shift + 1px lift, nothing more. No universal `scale-105`.
- Nav link: underline draws in on hover/active.

## CTA voice

- **Primary:** solid accent fill, `--color-accent-ink` text, small radius (`--radius`).
- **Secondary:** hairline outline on paper, ink text.
- Labels are short and never wrap to two lines.

## Per-page allowances

- Marketing (home guest): may use a full-bleed typographic hero. No enrichment art.
- App pages: no enrichment — the data is the page.
- Auth: one solid brand panel; no decorative blobs or glows.

## What pages MUST share

- The `Grocery` wordmark (Fraunces, flat — no gradient tile).
- The accent colour and its ≤5% placement.
- Fraunces + Manrope.
- The CTA voice (button shape, radius, padding).
- Flat hairline surfaces — no glassmorphism, no gradients, no radial glows.

## What pages MAY differ on

- Macrostructure within the family (Marquee Hero for marketing, Workbench for app).
- Row-vs-grid layout for collections.

## Removed in this refactor

Gradient icon tiles · `bg-clip-text` gradient headline · frosted-glass
translucent surfaces (`backdrop-blur`) · blurred colour blobs behind auth panels ·
stacked multi-radial-gradient + grid-overlay page background.
