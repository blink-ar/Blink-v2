# Handoff: Inicio (Home) Redesign — "Delivery-app" direction

## Overview
A redesign of Blink's **Inicio / Home** screen (mobile only) that keeps Blink's existing
indigo identity but adopts the warmth and structure of a food‑delivery app (PedidosYa‑style):
a location/address bar, a big rounded search, a circular category row, a promo banner, a
"Cerca tuyo" photo‑card carousel, a "Top descuentos hoy" ranked list, and a "Tus tarjetas"
strip — over the existing 4‑tab bottom nav.

This replaces the **mobile** layout of `src/pages/HomePage.tsx` (the `lg:hidden` `<main>` block).
**Do not touch the desktop layout** — this project is mobile‑only in practice, but if the
`lg:` block exists, leave it as‑is or out of scope.

## About the Design Files
The files in this bundle are **design references created in HTML** — a prototype showing the
intended look and behavior, **not** production code to paste in. Your task is to **recreate
this design inside the existing Blink codebase** (React + Vite + TypeScript + Tailwind),
reusing its established patterns: the `blink-*` Tailwind tokens, the `BottomNav` component,
Material Symbols icons, React Router `<Link>`/`useNavigate`, and the existing data hooks
(`useBenefitsData`, `fetchBanks`, etc.). Wire the cards to real data the same way the current
`HomePage.tsx` does (`top5`, `businesses`, `indexedEntities`).

- **`Blink Home.dc.html`** — the prototype. Open it in a browser to see the target.
- **`ios-frame.jsx` / `support.js`** — only the device bezel + the prototype runtime. **Ignore
  these for implementation** — the real app already runs on a phone; you only need the screen
  content *inside* the frame.

## Fidelity
**High‑fidelity (hifi).** Final colors, typography, spacing, radii, and shadows are specified
below. Recreate pixel‑accurately using Tailwind + the existing tokens. Exact hex values and px
are given; map them to Tailwind classes / arbitrary values (`rounded-[18px]`, etc.).

---

## Screens / Views

### Screen: Inicio (Home) — mobile
- **Purpose**: Entry point. User scans nearby merchants with active benefits, today's top
  discounts, and jumps into search / categories / their cards.
- **Container**: full‑height column, `background: #F7F6F4` (`bg-blink-bg`), `color: #1C1C1E`
  (`text-blink-ink`), font **Poppins** (see Typography — this is a change from Space Grotesk).
- **Vertical order** (top → bottom): App bar → Search → Category circles → Promo banner →
  Quick‑filter chips → "Cerca tuyo" carousel → "Top descuentos hoy" list → "Tus tarjetas" strip
  → bottom nav. Sections are separated by ~22–26px vertical gaps. Horizontal page padding is
  **18px**. Horizontal scrollers bleed to the screen edge (padding lives inside the scroller).

#### Component: Top App Bar
- Layout: `flex` row, `space-between`, padding `6px 18px 12px`.
- **Left** — location group, `flex` row, `gap:11px`:
  - Icon tile: `40×40`, `border-radius:13px`, `background: linear-gradient(135deg,#6366F1,#818CF8)`,
    `box-shadow:0 5px 14px rgba(99,102,241,.38)`, white Material icon `near_me` @22px.
  - Two lines:
    - Label: "Beneficios cerca de" — 11px / weight 600 / `#9CA3AF` (`text-blink-muted`),
      `letter-spacing:.02em`.
    - Value row (`flex`, `gap:2px`): "Palermo, CABA" — 16px / weight 700 / `#1C1C1E`, then
      Material icon `expand_more` @19px in `#6366F1`. (Wire to user's selected city.)
- **Right** — `flex` row, `gap:9px`:
  - Bell button: `40×40`, `border-radius:13px`, `background:#fff`, `border:1px solid #EBE9E4`,
    `box-shadow:0 2px 8px rgba(28,28,30,.05)`, Material `notifications` @21px `#1C1C1E`.
    Unread dot: `8×8` circle `#F59E0B` with `1.5px` white border, top‑right. → `navigate('/notifications')`.
  - Avatar: `40×40` circle, `background: linear-gradient(135deg,#6366F1,#818CF8)`, white initial
    (user's first letter) 15px/700. → `Link to="/profile"`. Falls back to Material `person` when logged out.

#### Component: Search field
- `flex` row, height `54px`, `border-radius:18px`, `background:#fff`, `padding:0 7px 0 16px`,
  `border:1px solid #EFEDE8`, `box-shadow:0 8px 22px rgba(28,28,30,.09)`, `gap:11px`.
- Material `search` @23px `#9CA3AF`; placeholder text "Buscar comercios, marcas o bancos" 14.5px/500 `#9CA3AF`.
- Trailing button (the existing filter affordance): `40×40`, `border-radius:13px`, indigo
  gradient, white Material `tune` @21px. 
- Behavior: tapping the field opens the existing search overlay (`openSearchOverlay`); the `tune`
  button can route to `/search` with the filter panel open.

#### Component: Category circles (horizontal scroll)
- Scroller: `flex`, `gap:14px`, `overflow-x:auto`, hidden scrollbar, `padding:0 18px`.
- Each item: column, `gap:8px`, fixed `width:58px`. Circle `58×58`, `border-radius:19px`,
  tinted bg, centered Material icon @27px in the matching text color. Label below: 11px/600 `#4B5563`.
- The 7 items (use the existing category color tokens):

  | Label   | Icon            | bg        | icon color |
  |---------|-----------------|-----------|------------|
  | Gastro  | `restaurant`    | `#FEF3C7` | `#92400E`  |
  | Moda    | `checkroom`     | `#FCE7F3` | `#9D174D`  |
  | Súper   | `shopping_cart` | `#D1FAE5` | `#065F46`  |
  | Viajes  | `flight`        | `#DBEAFE` | `#1E40AF`  |
  | Hogar   | `home`          | `#FEE2E2` | `#991B1B`  |
  | Electro | `devices`       | `#EDE9FE` | `#4C1D95`  |
  | Belleza | `spa`           | `#FFE4E6` | `#9F1239`  |

- Each → `navigate('/search?category=<token>')` (reuse `handleDesktopCategoryClick` logic).

#### Component: Promo banner ("Beneficio del día")
- Card: `border-radius:22px`, `background: linear-gradient(125deg,#6366F1 0%,#818CF8 100%)`,
  `padding:20px`, `box-shadow:0 12px 30px rgba(99,102,241,.32)`, `position:relative; overflow:hidden`.
- Two decorative translucent white circles (`rgba(255,255,255,.10)` top‑right `150×150`;
  `rgba(255,255,255,.08)` bottom `96×96`).
- Content (max‑width 72%):
  - Eyebrow pill "BENEFICIO DEL DÍA" — 10px/700, `letter-spacing:.08em`, white text on
    `rgba(255,255,255,.20)`, `padding:4px 10px`, `border-radius:999px`.
  - Title "Hasta 40% OFF" — 27px/800 white, `line-height:1.05`, `margin:12px 0 2px`.
  - Subtitle "unificado entre todas tus tarjetas" — 13px/500 `rgba(255,255,255,.88)`.
  - CTA pill "Ver beneficios" + Material `arrow_forward` @17px — white bg, `#4F46E5` text,
    13px/700, `padding:9px 16px`, `border-radius:999px`.
  - Right icon tile: `60×60`, `border-radius:18px`, `rgba(255,255,255,.16)`, Material `local_offer` @32px white.
- Pager dots below (centered, `gap:6px`, `padding-top:12px`): active `18×6` rounded `#6366F1`;
  two inactive `6×6` `#D6D3CD`.
- This is the **differentiator** — copy emphasizes Blink unifying duplicate Modo offers across cards.
  Optional toggle (`showPromo`).

#### Component: Quick‑filter chips (horizontal scroll)
- Scroller `flex`, `gap:9px`, `overflow-x:auto`, `padding:0 18px`. Chip height `38px`,
  `border-radius:999px`, `padding:0 15px`, 13px/600, `gap:6px`, leading Material icon @18px.
- Chips (map to existing `DESKTOP_QUICK_FILTERS` routes):
  - **Cerca tuyo** — *active*: indigo gradient bg, white text, `box-shadow:0 4px 12px rgba(99,102,241,.3)`, icon `near_me`. → `/search?nearby=1`
  - **20%+ OFF** — white, `border:1px solid #EBE9E4`, `#374151` text, icon `percent` `#10B981`. → `/search?discount=20`
  - **Cuotas sin interés** — same white style, icon `credit_card` `#6366F1`. → `/search?installments=1`
  - **Online** — same white style, icon `language` `#6366F1`. → `/search?online=1`

#### Component: "Cerca tuyo" section
- Header row: title "Cerca tuyo" 17px/700 `#1C1C1E`; right link "Ver todo" 12px/600 `#6366F1` → `/search`.
- Carousel: `flex`, `gap:14px`, `overflow-x:auto`, `padding:0 18px`.
- **Card** (wire to `businesses` / a "nearby" list): fixed `width:232px`, `background:#fff`,
  `border-radius:20px`, `border:1px solid #EFEDE8`, `box-shadow:0 8px 22px rgba(28,28,30,.07)`,
  `overflow:hidden`.
  - **Media** `height:124px`. In the prototype it's a striped placeholder
    (`repeating-linear-gradient(135deg,<tintA> 0 11px,<tintB> 11px 22px)`) with a mono caption
    `foto · comercio`. **In the app, render the real `business.image`** (use
    `getOptimizedImageUrl(image,{width:480})`), object‑cover, with the existing indigo gradient
    fallback when missing.
    - Favorite button top‑right: `32×32` white circle, `box-shadow:0 2px 6px rgba(0,0,0,.12)`,
      Material `favorite` @18px (`#6366F1` when saved, `#9CA3AF` otherwise).
    - Discount badge bottom‑left: indigo gradient pill, `padding:5px 10px`, `border-radius:11px`,
      `box-shadow:0 4px 12px rgba(99,102,241,.4)`; number 15px/800 white + "OFF" 9px/700 at 85% opacity.
  - **Body** `padding:12px 13px 14px`:
    - Name row: name 15px/700 `#1C1C1E` (truncate) + "· {distance}" 11px `#9CA3AF`
      (use `business.distanceText || formatDistance(business.distance)`).
    - Subtitle: "{Categoría} · {tipo}" 11.5px `#9CA3AF`, `margin:2px 0 9px`.
    - **Bank chips** row (`gap:6px`, `margin-bottom:9px`): for each card/issuer on the benefit,
      a pill — `background:#F3F2EF`, `padding:3px 9px`, `border-radius:999px`, 10.5px/600 `#4B5563`,
      with a `7×7` colored dot + bank name. Dot colors are brand hints, **not** logos:
      Galicia `#F25C05`, Santander `#EC0000`, BBVA `#1464A5`, Macro `#00A3A3`, Nación `#1B3C8C`, ICBC `#C8102E`.
      (Prefer the existing `BankLogo` component if you want real logos.) Optional toggle (`showCards`/bank chips).
    - Footer row (`border-top:1px solid #F0EEEA`, `padding-top:9px`, `gap:6px`): a benefit summary
      — Material icon @16px (`savings` `#10B981` for tope/ahorro, or `credit_card` `#6366F1` for cuotas)
      + text 11.5px/600 `#374151`, e.g. "Tope $6.000 · Lun a Vie" or "2 cuotas sin interés"
      (from `benefit.tope`, `benefit.cuando`/`availableDays`, `benefit.installments`).
- Prototype sample cards: Café Martínez 30% (Galicia/BBVA, Tope $6.000 · Lun a Vie, 400 m),
  Freddo 25% (Santander, 2 cuotas, 650 m), Rapsodia 20% (BBVA/Macro, Hasta 6 cuotas, 1.1 km).

#### Component: "Top descuentos hoy 🔥" section
- Header: title "Top descuentos hoy" 17px/700 + 🔥; right link "Ver todo" 12px/600 `#6366F1`.
- Wire to the existing **`top5`** memo (top individual benefits by discount, distinct merchants).
- Vertical list, `gap:10px`, `padding:0 18px`. **Row**: `flex` row, `gap:12px`, `background:#fff`,
  `border:1px solid #EFEDE8`, `border-radius:18px`, `padding:11px 12px`, `box-shadow:0 4px 14px rgba(28,28,30,.05)`.
  - Discount tile `52×52`, `border-radius:15px`, `background:#EEF0FE`, number 15px/800 `#4F46E5`;
    rank badge top‑left `19×19` circle `#1C1C1E`, white 10px/700 index.
  - Middle (flex:1, min‑w:0): name 14.5px/700 (truncate); "{Categoría} · {emisor} {tarjeta}" 11.5px `#9CA3AF`;
    days chip — `background:#F3F2EF`, `padding:2px 8px`, `border-radius:999px`, 10px/600 `#6B7280`,
    Material `schedule` @13px + text (e.g. "Mié y Jue").
  - Trailing Material `chevron_right` @22px `#C9C6C0`.
  - Row → `handleTopBenefitClick(...)` → `buildBenefitPath(...)`.
- Prototype samples: Garbarino 40% (Electro · Nación Visa · Mié y Jue), Dexter 35%
  (Deportes · Galicia Eminent · Fines de semana), Sushi Club 30% (Gastronomía · Santander · Lun a Jue).

#### Component: "Tus tarjetas" strip
- Header: "Tus tarjetas" 17px/700; right link "Gestionar" 12px/600 `#6366F1`.
- Scroller `flex`, `gap:9px`, `overflow-x:auto`, `padding:0 18px`. Chip height `42px`,
  `border-radius:14px`, `padding:0 15px`, 13px/600 `#374151`, `background:#fff`,
  `border:1px solid #EBE9E4`, `box-shadow:0 2px 8px rgba(28,28,30,.04)`, leading `9×9` brand dot.
- Last chip "Agregar": `background:#F2F1FB`, `border:1px dashed #B9BCF0`, `#6366F1` text, Material `add` @18px.
- Wire to the user's saved cards / `indexedEntities`; chips → `navigate('/search?bank=<token>')`. Optional section (`showCards`).

#### Component: Bottom nav
- **Reuse the existing `BottomNav` component** (`src/components/neo/BottomNav.tsx`) — do not rebuild.
  It already matches: 4 tabs (Inicio · Buscar · Mapa · Guardados), active tab gets a
  `bg-primary/10` rounded icon chip + `text-primary` label, filled Material icon when active.
  The prototype's nav is just a visual stand‑in.

---

## Interactions & Behavior
- **Search field tap** → open existing search overlay (`openSearchOverlay` / `isSearchOpen`).
- **Category circle / quick chip / bank chip** → `navigate(...)` with the routes above; keep the
  existing `trackFilterApply` analytics calls.
- **Card / top‑row tap** → existing `handleTopBenefitClick` → `buildBenefitPath` (passes `business` in route state).
- **Favorite tap** → toggle saved state (Saved feature); `stopPropagation` so it doesn't trigger the card nav.
- **Active press feedback**: `active:scale-[0.97]` on cards, `active:scale-95` on icon buttons (match current app).
- **Horizontal scrollers**: native overflow‑x with hidden scrollbar (`.no-scrollbar` already exists in the app — reuse it instead of the prototype's `.noscroll`).
- **Loading**: reuse existing skeletons (`SkeletonAvailableBanks`, the Top‑5 skeleton pattern) while data loads.

## State Management
No new global state. Reuse existing hooks/state from `HomePage.tsx`:
`useBenefitsData({})` → `businesses` + `isLoading`; the `top5` memo; `fetchBanks` → `availableBankNames`
→ `indexedEntities` via `buildBankOptions`; `fetchMongoStats` for counts; `useAuth` for the avatar;
`usePushNotifications` for the bell. Optional local UI flags: `showPromo`, `showBankChips` (or read from config).

## Design Tokens
- **Colors**: `#6366F1` primary (`primary`/`blink-accent`), gradient `#6366F1 → #818CF8`,
  `#4F46E5` deep indigo (badges/text on tint), `#EEF0FE` indigo tint, `#F7F6F4` bg (`blink-bg`),
  `#FFFFFF` surface, `#1C1C1E` ink (`blink-ink`), `#374151`/`#4B5563`/`#6B7280` body grays,
  `#9CA3AF` muted (`blink-muted`), `#EFEDE8`/`#EBE9E4`/`#F0EEEA` borders (`blink-border` family),
  `#F3F2EF`/`#F2F1FB` chip fills, `#10B981` positive (`blink-positive`), `#F59E0B` warn/notify dot (`blink-warning`).
  Category tints + bank dot colors are tabulated above.
- **Spacing**: page padding 18px; section gaps 22–26px; card inner padding 12–14px; scroller gaps 9–14px.
- **Typography**: **Poppins** 400/500/600/700/800 (display + UI — *new*, replaces Space Grotesk);
  **JetBrains Mono** for placeholder captions only. Scale used: 27/17/16/15/14.5/13/12/11.5/11/10.5/10px.
  Add Poppins to the font `<link>` / Tailwind `fontFamily` (or swap the existing `font-body`).
- **Radius**: cards 20px; search/list rows 18px; promo 22px; category circles 19px; icon tiles 13–15px; chips 999px (pill).
- **Shadows**: cards `0 8px 22px rgba(28,28,30,.07)`; search `0 8px 22px rgba(28,28,30,.09)`;
  list rows `0 4px 14px rgba(28,28,30,.05)`; promo `0 12px 30px rgba(99,102,241,.32)`;
  indigo tiles `0 4px 12px rgba(99,102,241,.3–.4)`; nav `0 -4px 22px rgba(0,0,0,.05)`.

## Assets
- **Icons**: Material Symbols Outlined (already loaded in the app) — `near_me, expand_more,
  notifications, search, tune, restaurant, checkroom, shopping_cart, flight, home, devices, spa,
  local_offer, arrow_forward, percent, credit_card, language, favorite, savings, schedule,
  chevron_right, add, map, person`.
- **Fonts**: Poppins + JetBrains Mono (Google Fonts).
- **Merchant images**: real photos come from the live API (`business.image` via `getOptimizedImageUrl`).
  The prototype's striped tiles are placeholders only. **No fake bank logos** — use `BankLogo` or the colored dots.

## Files
- `Blink Home.dc.html` — the design prototype (open in a browser).
- `ios-frame.jsx`, `support.js` — prototype device frame + runtime (reference only; not for implementation).
- Target file to change in the codebase: `src/pages/HomePage.tsx` (mobile `lg:hidden` block).
  Reuse: `src/components/neo/BottomNav.tsx`, `src/components/BankLogos/BankLogo.tsx`, existing skeletons,
  `src/utils/*` (`benefitIdentity`, `banks`, `distance`, `images`), and the `blink-*` tokens in `tailwind.config.js`.
