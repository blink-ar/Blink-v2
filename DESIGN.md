# Blink — Design

> Encontrá descuentos, cuotas y beneficios bancarios en comercios de toda Argentina.

This document captures the design system and the landing-page design for **Blink**, derived from the codebase — not invented. Every token, color, font, and string traces back to a source file.

---

## 1. Product, in one line

Blink is a mobile-first **PWA** that indexes **bank benefits** (discounts, cuotas sin interés, reintegros) across commerce in **Argentina**, and lets people find exactly what applies to them by **bank × category × city**.

- Hero promise: *"Todos tus descuentos en un solo lugar"* — [HomePage.tsx:315](src/pages/HomePage.tsx#L315)
- Sub-promise: *"Bancos · Billeteras · Clubes · Suscripciones"* — [HomePage.tsx:325](src/pages/HomePage.tsx#L325)
- Primary CTA: *"Buscá beneficios"* — [HomePage.tsx:337](src/pages/HomePage.tsx#L337)
- Status: **Beta** — *"Estamos en Beta! Estos son los emisores disponibles hoy en Blink."* — [HomePage.tsx:356](src/pages/HomePage.tsx#L356)
- Tagline / meta: [index.html:7](index.html#L7)

**What leads.** The README/meta leads with *finding bank discounts across Argentine commerce*, so that dominates the page. The differentiator — reading each promo and **unifying duplicate Modo offers** while surfacing días/tope/vigencia — is the work happening on the current branch ([dedupeModoBenefits.ts](src/utils/dedupeModoBenefits.ts)), so it earns its own section.

---

## 2. The product's native shape

Blink is a **catalog of bank benefits indexed by bank × category × city**. The data model says so:

- A `Business` holds many `BankBenefit`s — [index.ts:44](src/types/index.ts#L44)
- A benefit carries: `discountPercentage`, `installments` (cuotas), `availableDays`, `tope` (cap), `validUntil`, `online`, and `acceptsModo` — [benefit.ts](src/types/benefit.ts), [index.ts:12](src/types/index.ts#L12)
- SEO routes are literally `/descuentos/{bank}/{category}/{city}` — [landingData.ts:`getLandingPath`](src/seo/landingData.ts)

So the page is organized along that spine, not a generic section template:

```
Hero  →  Emisores  →  Benefit anatomy  →  Categories  →  Cities  →  Install (PWA)
```

---

## 3. Real content (nothing placeholder)

Pulled from [src/seo/landingData.ts](src/seo/landingData.ts):

**Emisores (6, Beta):** Banco Galicia · Banco Santander · BBVA · Banco Macro · Banco Nación · ICBC

**Categorías (6):** Gastronomía · Moda · Supermercado y shopping · Hogar · Deportes · Belleza

**Ciudades (8):** Buenos Aires · CABA · Córdoba · Rosario · Mendoza · La Plata · Mar del Plata · Tucumán

---

## 4. Visual identity

All values are inherited from [tailwind.config.js](tailwind.config.js) and [index.html](index.html). This is an existing design system ("Minimalist Bento Grid palette") — the design inherits it rather than introducing anything new.

### Color

| Token | Value | Role |
|---|---|---|
| `primary` / `blink-accent` | `#6366F1` | Soft indigo — primary accent |
| gradient indigo | `#6366F1 → #818CF8` | CTAs, brand, headline emphasis |
| `blink-bg` | `#F7F6F4` | Warm off-white background |
| `blink-ink` | `#1C1C1E` | Soft deep text (not pure black) |
| `blink-positive` | `#10B981` | Discounts / savings (emerald) |
| `blink-warning` | `#F59E0B` | Warm amber |
| `blink-surface` | `#FFFFFF` | Cards / surfaces |
| `blink-muted` | `#9CA3AF` | Secondary text |
| `blink-border` | `#E8E6E1` | Soft warm border |

**Category color-coding** (used in the categories bento) — [tailwind.config.js:18-29](tailwind.config.js#L18):
food `#FEF3C7`/`#92400E` · fashion `#FCE7F3`/`#9D174D` · travel `#DBEAFE`/`#1E40AF` · sport `#D1FAE5`/`#065F46` · tech `#EDE9FE`/`#4C1D95` · home `#FEE2E2`/`#991B1B`.

### Type

- **Display / body:** Space Grotesk
- **Mono:** JetBrains Mono
- Loaded fonts also include Archivo Black; icons via **Material Symbols Outlined** — [index.html:32-34](index.html#L32)

### Shape & depth

- Radii: cards `2xl` = 24px, controls 12–18px, chips `pill` — [tailwind.config.js:45](tailwind.config.js#L45)
- Shadows: `soft` / `soft-md` / `soft-lg` (low-opacity, layered) — [tailwind.config.js:36](tailwind.config.js#L36)
- Motion: `fade-in`, `slide-up`, `marquee` — [tailwind.config.js:56](tailwind.config.js#L56)

---

## 5. Page structure & rationale

1. **Nav** — Blink wordmark + `Beta` chip + persistent *"Buscá beneficios"* CTA. Glassy, sticky (mirrors the app header in [LandingPage.tsx:217](src/pages/LandingPage.tsx#L217)).
2. **Hero** — the headline promise with the real gradient on the second line; sub-tags echo *Bancos · Billeteras · Clubes · Suscripciones*. A **phone mock** renders the actual app shell — search bar, benefit cards, 5-tab bottom nav (Home · Search · Map · Saved · Profile, from [src/pages](src/pages)) — so the hero shows the product, not stock UI.
3. **Emisores** — the 6 Beta banks, framed with the real *"Estamos en Beta"* line.
4. **Benefit anatomy** ("sin letra chica") — the differentiator. One annotated card + four features: descuento/cuotas, los días que aplica, tope y vigencia, **Modo unificado**. Straight from the benefit fields and the dedup logic.
5. **Categorías** — bento grid using the category color tokens.
6. **Ciudades** — chips for the 8 indexed cities; nods to the map view.
7. **Install (PWA)** — installable, offline, lightweight, notifications. Blink is a PWA ([vite-plugin-pwa](package.json)).
8. **Footer** — tagline, explore/product links, `blinkapp.com.ar`, "Hecho en Argentina".

---

## 6. Honest caveats

- **Bank logo tiles** use plausible brand hues, *not* repo assets. A [`BankLogos`](src/components/BankLogos) component folder exists — wire those in for pixel-accurate logos.
- Sample card **numbers** (30%, $6.000, "3 cuotas") are illustrative; real values come from the live MongoDB API ([MONGODB_API_INTEGRATION.md](MONGODB_API_INTEGRATION.md)), not the repo.
- The app gates desktop ([DesktopUnsupportedPage.tsx](src/pages/DesktopUnsupportedPage.tsx)); this landing is the desktop-friendly marketing surface that funnels to the mobile PWA.

---

## 7. Artifact

The design is realized as a self-contained, dependency-free page: **[landing.html](landing.html)** (open directly in a browser). It uses only the tokens, fonts, and copy documented above.
