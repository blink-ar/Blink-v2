# Handoff: Buscar + Comercio Redesign — "Delivery-app" direction

## Overview
Two screens of Blink redesigned in a warmed, food-delivery-app visual language that keeps
Blink's indigo identity but adds friendlier type (Poppins), rounded cards, soft shadows, and
real bank logos:

1. **Buscar** (search results + filters) → `src/pages/SearchPage.tsx`
2. **Comercio** (business detail) → `src/pages/BusinessDetailPage.tsx`

These two flow into each other (tap a Buscar result → Comercio), so they share one design
system and are bundled together here. Mobile only.

## About the Design Files
These are **design references created in HTML** — prototypes of the intended look, **not**
production code to paste in. Recreate them inside the existing Blink codebase (React + Vite +
TypeScript + Tailwind), reusing its established patterns: the `blink-*` Tailwind tokens,
`BankLogo`, `BusinessResultCard`, the `BottomNav` component, Material Symbols, React Router, and
the existing data hooks / memos on each page.

- **`Blink Buscar.dc.html`** — the Buscar prototype.
- **`Blink Comercio.dc.html`** — the Comercio prototype.
- **`banks/*.png`** — real bank logos used in the mocks, copied from the app's own
  `public/banks/`. In the app, keep using `BankLogo` / `public/banks/` — do **not** ship these copies.
- **`ios-frame.jsx` / `support.js`** — prototype device bezel + runtime. **Ignore for
  implementation** — you only need the screen content inside the frame.

Open each `.dc.html` in a browser to see the target.

## Fidelity
**High-fidelity.** Exact colors, type, spacing, radii, shadows are specified per screen below.
Recreate pixel-accurately with Tailwind + existing tokens (`rounded-[18px]`, arbitrary values
where needed).

---

## Shared design system (applies to both screens)
- **Background** `#F7F6F4` (`bg-blink-bg`); **surface** `#FFFFFF`; **ink** `#1C1C1E`.
- **Primary** indigo `#6366F1`, gradient `#6366F1 → #818CF8` (135deg); deep indigo `#4F46E5` /
  `#4338CA`; indigo tint `#EEF0FE`.
- **Grays**: body `#374151`/`#4B5563`/`#6B7280`; muted `#9CA3AF` (`blink-muted`); borders
  `#EFEDE8`/`#EBE9E4`/`#F0EEEA`; chip fill `#F3F2EF`.
- **Positive** `#10B981` / `#047857`; **favorite-filled** `#EF4444`.
- **Typography**: **Poppins** 400/500/600/700/800 (display + UI — *new*, replaces Space Grotesk;
  add it to the font `<link>` / Tailwind `fontFamily`). JetBrains Mono for placeholder captions only.
- **Radius**: cards 18–22px; pills 12px; chips/pills full (999px); tags 7px.
- **Icons**: Material Symbols Outlined (already loaded in the app).
- **Bank logos**: real PNGs via `BankLogo` / `public/banks/` — **never** redrawn/fake logos.
  Rendered as small white circles (`box-shadow:0 1px 3px rgba(0,0,0,.14)`), sizes per screen.
- **Bottom nav**: reuse the existing `BottomNav` component — do not rebuild. (Buscar shows it with
  the "Buscar" tab active; Comercio is a pushed detail route with **no** bottom nav.)

---

# Screen 1 — Buscar (Search) · `src/pages/SearchPage.tsx`

- **Purpose**: search + filter merchants by category / bank / discount / proximity, and scan results.
- **Container**: full-height column on `#F7F6F4`, Poppins. Horizontal page padding 16–18px.
  Horizontal scrollers bleed to the edge (padding inside the scroller).
- **Vertical order**: search header → filter-pill row → results header (count + sort) → result list → bottom nav.

### Component: Search header
- `flex` row, `gap:10px`, `padding:4px 16px 0`.
- Back button `44×44`, `border-radius:14px`, `background:#fff`, `border:1px solid #EBE9E4`,
  `box-shadow:0 2px 8px rgba(28,28,30,.05)`, Material `arrow_back` @22px → `navigate(-1)`.
- Search field (flex:1, height 44px, `border-radius:14px`, `background:#fff`, `border:1px solid #EFEDE8`,
  `box-shadow:0 6px 18px rgba(28,28,30,.08)`, `padding:0 14px`, `gap:10px`): Material `search` @21px
  `#9CA3AF` + placeholder "Buscar tiendas y beneficios…" 14px/500 `#9CA3AF`. Wire to the existing
  search input/overlay.

### Component: Filter-pill row (horizontal scroll)
- Scroller `flex`, `gap:8px`, `overflow-x:auto`, `padding:14px 16px 16px`. Use the existing
  `.no-scrollbar` util. Pills height `38px`, `border-radius:12px`, 13px/600, leading Material icon @18px.
- **`tune` button** (leading, `40×38`, indigo gradient, white icon, `box-shadow:0 4px 12px rgba(99,102,241,.32)`)
  with an **active-filter count badge** (top-right `#1C1C1E` pill, white 10px/700, `1.5px` bg-colored
  border) → opens the existing filter sheet; badge = number of active filters.
- Pill states:
  - **Active / selected**: indigo gradient bg, white text, `box-shadow:0 4px 12px rgba(99,102,241,.3)`
    (e.g. "Cerca" with `location_on`).
  - **Selected category** (removable): `background:rgba(99,102,241,.10)`, `border:1px solid rgba(99,102,241,.32)`,
    `#4F46E5` text, trailing `close` icon @16px (e.g. "Gastronomía" `restaurant`).
  - **Idle**: `background:#fff`, `border:1px solid #EBE9E4`, `#374151` text. Sheet-openers
    ("Bancos" `account_balance`) get a trailing `expand_more` @16px `#9CA3AF`.
- Map these to the existing filter set (Bancos / Categoría sheets + Cerca / Hoy / Online / Cuotas /
  discount). Keep current `trackFilterApply` analytics.

### Component: Results header
- `flex` space-between, `padding:0 18px`. Left: "Tiendas" 17px/700 + a count chip
  ("{n} resultados" 11px/700 `#4F46E5` on `#EEF0FE`, `padding:3px 9px`, pill). Right: sort toggle
  "Cercanía" 12px/600 `#6366F1` + `swap_vert` @16px (existing sort control; optional via `showSort`).

### Component: Result list
- Vertical list, `gap:11px`, `padding:0 16px`. Wire to the page's existing results array; reuse
  `BusinessResultCard`'s data (name, category, distance, banks, best discount / installments).
- **Row** (`flex`, `gap:12px`, `align-items:center`, `background:#fff`, `border:1px solid #EFEDE8`,
  `border-radius:18px`, `padding:10px`, `box-shadow:0 4px 14px rgba(28,28,30,.05)`):
  - **Thumbnail** `66×66`, `border-radius:15px`, `overflow:hidden`. Real `business.image` via
    `getOptimizedImageUrl(image,{width:160})`, `object-cover`; indigo gradient fallback. Striped tile
    in the mock is placeholder only.
  - **Middle (flex:1, min-w:0)**: name 15px/700 (truncate) + "· {distance}" 11px `#9CA3AF`;
    "{Categoría} · {tipo}" 11.5px `#9CA3AF` (`margin:1px 0 7px`); **bank logos** row (`gap:5px`) of
    `24×24` circular `BankLogo`s (optional via `showBankChips`).
  - **Right (flex:none, ~44px, centered)**: the benefit figure.
    - Discount: "hasta" 8px/700 uppercase `#047857` / "{X}%" 23px/800 `#10B981` / "OFF" 8px/700 `#047857`.
    - Installments: "hasta" 8px/700 `#4338CA` / "{N}" 23px/800 `#6366F1` / "cuotas" 8px/700 `#4338CA`.
  - Row → existing business-select navigation (`handleBusinessSelect` → Comercio, passing `business` in route state).
- **Loading**: reuse existing result skeletons. **Empty**: reuse existing empty state.

### Bottom nav
Reuse `BottomNav` with "Buscar" active.

---

# Screen 2 — Comercio (Business Detail) · `src/pages/BusinessDetailPage.tsx`

- **Purpose**: one merchant + all its benefits, **grouped by bank** so duplicate offers are easy
  to compare — Blink's core value.
- **Container**: full-height column on `#F7F6F4`, Poppins. Page padding 16px; group gap 13px.
  **No bottom nav** (pushed detail route; hero back pops it).
- **Vertical order**: hero → overlapping merchant card → view-mode pills → bank-grouped benefit cards.

### Component: Hero
- `position:relative`, `height:212px`, full-bleed. Real `business.image`
  (`getOptimizedImageUrl(image,{width:800})`), `object-cover`; indigo gradient fallback. Striped
  tile + `foto · local` caption in the mock are placeholder only.
- Scrim: `linear-gradient(to bottom, rgba(0,0,0,.18) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 60%, rgba(28,28,30,.28) 100%)`.
- **Floating controls** (`40×40` circles, `background:rgba(255,255,255,.92)`, `backdrop-filter:blur(8px)`,
  `box-shadow:0 2px 10px rgba(0,0,0,.18)`, `top:54px` — use `env(safe-area-inset-top)`):
  - Top-left `arrow_back` @22px → `navigate(-1)`.
  - Top-right (`gap:9px`): `ios_share` @21px (share handler); `favorite` @21px — saved `#EF4444` +
    `FILL 1`, else `#1C1C1E` unfilled (toggle saved state).
- **Max-discount badge** bottom-left (`left:16px; bottom:38px`): indigo gradient pill `padding:6px 13px`,
  `border-radius:12px`, `box-shadow:0 6px 16px rgba(99,102,241,.45)`, "{X}%" 17px/800 white +
  "OFF máx" 10px/700 @90%. Derive from the merchant's best benefit.

### Component: Merchant card (overlaps hero)
- `margin:-26px 16px 0`, `z-index:2`, `background:#fff`, `border:1px solid #EFEDE8`, `border-radius:22px`,
  `padding:16px`, `box-shadow:0 12px 30px rgba(28,28,30,.10)`.
- Top row (`gap:13px`): logo tile `58×58`, `border-radius:17px`, `background:#EEF0FE`,
  `box-shadow:0 4px 12px rgba(99,102,241,.18)` (merchant logo, else initial 26px/800 `#4F46E5`);
  name `<h1>` 19px/800 (truncate); "{Categoría} · {tipo}" 12px/500 `#9CA3AF`; status row —
  `7×7` `#10B981` dot + "{n} beneficios activos" 12px/600 `#047857`.
- Footer row (`margin-top:14px`, `padding-top:14px`, `border-top:1px solid #F0EEEA`): left
  `location_on` @18px `#6366F1` + "{distance}" · "{n} sucursales" 12.5px/600 `#4B5563`; right CTA
  "Cómo llegar" indigo gradient pill (white, 12.5px/700, `padding:8px 14px`, `border-radius:12px`,
  `map` @17px) → directions for nearest branch.

### Component: View-mode pills (horizontal scroll)
- Scroller `flex`, `gap:8px`, `overflow-x:auto`, `padding:16px 16px 6px`. Pills height `38px`,
  `border-radius:12px`, 13px/600, icon @17px. Maps to the page's existing **three view modes**:
  - **Hoy** (`today`) — valid today.
  - **Agrupado** (`visibility`) — *active in the mock*: indigo gradient, white, `box-shadow:0 4px 12px rgba(99,102,241,.3)`. Grouped by bank (default).
  - **Por sucursal** (`storefront`) — grouped by branch.
- Idle: `background:#fff`, `border:1px solid #EBE9E4`, `#374151` text, icon `#6366F1`.

### Component: Bank-grouped benefit card
One card per bank (`background:#fff`, `border:1px solid #EFEDE8`, `border-radius:18px`,
`overflow:hidden`, `box-shadow:0 4px 14px rgba(28,28,30,.05)`).
- **Group header** (`flex`, `gap:10px`, `padding:11px 14px`, tinted bg): `26×26` circular `BankLogo`
  + bank name 12.5px/700 `letter-spacing:.05em` uppercase, brand-tinted text. Tint pairs (bg/text/border):
  Galicia `#FFF3EA`/`#C2530F`/`#F0C19C`, Santander `#FDECEC`/`#C42121`/`#F1AFAF`; fall back to
  indigo `#EEF0FE`/`#4338CA`/`#C7D2FE`. Build a small bank→tint map.
- **Benefit row** (`padding:14px`, `border-top:1px solid #F0EEEA`, `flex`, `gap:12px`, `align-items:flex-start`):
  - Left (flex:1): title "{X}% de descuento" 15px/700 `line-height:1.2`; card/tier 12px `#9CA3AF`
    (`margin-bottom:9px`); tag row (`gap:8px`, wrap) — network tag (Visa/Mastercard/Amex) 10px/700
    brand-tinted text + brand-tinted `1px` border, `padding:2px 7px`, `border-radius:7px`; plus day
    availability, one of:
    - "Todos los días" pill 9.5px/700 `#DC2626`, `border:1px solid #F4B8B8`, uppercase, `border-radius:7px`.
    - **Day-indicator dots** (`gap:3px`): seven `18×18` circles L M X J V S D — active = brand bg +
      white, inactive = `#F3F4F6` + `#9CA3AF`, 8px/700. Optional via `showDayIndicators`.
  - Right (flex:none, text-align:right): "{X}%" 27px/800 `#1C1C1E` `line-height:1`; "de ahorro" 11px
    `#9CA3AF`; "Tope: ${amount}" 10px `#9CA3AF` (omit if none). For cuotas, show "{N}" + "cuotas" indigo `#6366F1`.
- **"Cuotas sin interés" group** (special): header bg `#EEF0FE`, text `#4338CA`, leading `26×26`
  `border-radius:8px` `#4F46E5` tile with white "CI" (or `credit_card` icon). Body: "Hasta {N} cuotas
  sin interés" 15px/700, then one compact sub-row per qualifying card (`border:1px solid #EFEDE8`,
  `border-radius:12px`, `padding:9px 11px`, space-between): left = `22×22` `BankLogo` + network tag +
  day text 11px `#6B7280`; right = "Ver" 11px/700 `#4338CA`, `border:1px solid #C7D2FE`, `border-radius:8px`.

---

## Interactions & Behavior
- **Buscar**: search field → existing search; filter pills / `tune` → existing filter state + sheet
  (keep `trackFilterApply`); sort toggle → existing sort; result row → `handleBusinessSelect` →
  Comercio (passes `business` in route state). Reuse skeletons + empty states.
- **Comercio**: back/share/favorite → `navigate(-1)` / share handler / saved-state toggle; view-mode
  pills → existing view-mode state (Hoy/Agrupado/Por sucursal) + memos; "Cómo llegar" → directions;
  benefit row → existing benefit-detail nav (`buildBenefitPath`) if linked. Reuse detail skeleton;
  keep current inactive (dimmed) styling for benefits not valid today.
- **Press feedback**: `active:scale-[0.99]` on cards, `active:scale-95` on icon buttons.

## State Management
No new global state. Reuse each page's existing hooks/state/memos exactly as they are
(`SearchPage.tsx` results + filter + sort state; `BusinessDetailPage.tsx` `business` fetch,
grouped-benefit memos, view-mode `useState`, favorite/share handlers, `useAuth`). Optional local
UI flags only: Buscar `showBankChips`/`showSort`; Comercio `showHeroPhoto`/`showDayIndicators`.

## Assets
- **Icons** (Material Symbols Outlined, already loaded): `arrow_back, search, tune, location_on,
  restaurant, account_balance, expand_more, close, credit_card, percent, swap_vert, ios_share,
  favorite, map, today, visibility, storefront`.
- **Fonts**: Poppins + JetBrains Mono (Google Fonts).
- **Merchant images**: real `business.image` via `getOptimizedImageUrl`; striped tiles are placeholders only.
- **Bank logos**: real PNGs via `BankLogo` / `public/banks/`. The `banks/*.png` here are copies for
  the mocks — the app already has the real assets.

## Files
- `Blink Buscar.dc.html`, `Blink Comercio.dc.html` — the prototypes (open in a browser).
- `banks/*.png` — bank logos used in the mocks (reference; use `public/banks/` in the app).
- `ios-frame.jsx`, `support.js` — prototype frame + runtime (reference only; not for implementation).
- Target files: `src/pages/SearchPage.tsx`, `src/pages/BusinessDetailPage.tsx`. Reuse:
  `BusinessResultCard`, `BankLogo`, `BottomNav`, existing skeletons, `src/utils/*`
  (`benefitIdentity`, `banks`, `distance`, `images`), and the `blink-*` tokens.
