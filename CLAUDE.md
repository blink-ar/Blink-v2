# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blink-v2 is a fintech PWA + React Native app that helps users in Argentina discover bank card benefits (discounts, promotions) at local and online businesses. It is a monorepo with three main areas:

- **`src/`** — React 18 + TypeScript web PWA (Vite, Tailwind CSS)
- **`mobile/`** — React Native (Expo SDK 54) mobile app
- **`api/`** — Vercel serverless functions (Node.js + MongoDB + Meilisearch)

## Commands

### Web App (`/`)

```bash
npm run dev            # Dev server on port 5174 (Vite)
npm run dev:api        # Local API server (serverless functions)
npm run dev:all        # Both in parallel (pnpm required)
npm run build          # Production build (runs seo:generate first)
npm run lint           # ESLint check
npm run test           # Vitest single run
npm run test:watch     # Vitest watch mode
npm run test:coverage  # With coverage report
npm run test:ui        # Vitest UI dashboard
```

Run a single test file:
```bash
npx vitest run src/path/to/__tests__/file.test.ts
```

### Mobile App (`/mobile`)

```bash
cd mobile
npm install
npm start          # Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
```

## Architecture

### Data Flow

```
Component
  → Custom Hook (useBenefitsData / useEnrichedBusinesses)
    → TanStack React Query (cache layer, staleTime: 5min, gcTime: 30min)
      → src/services/api.ts (fetchBusinessesPaginated / search endpoint)
        → /api/[...path].js (Vercel serverless)
          → MongoDB (confirmed_benefits collection) + Meilisearch
```

The split between `/api/businesses` and `/api/search`:
- **No text query** → `/api/businesses` (pagination-friendly, CDN-cached)
- **Text query present** → `/api/search` (Meilisearch-backed, returns `SearchApiResponse`)

### Key Hooks

- **`useBenefitsData(filters)`** (`src/hooks/useBenefitsData.ts`) — Primary data hook. Uses `useInfiniteQuery` for paginated business listing. Handles two location strategies:
  - `sortByDistance: true` + GPS position available → sends exact `lat`/`lng` to API (bypasses CDN cache, precise sort)
  - Otherwise → sends a **geohash** prefix (CDN-cacheable, approximate proximity)
  - Waits for geolocation to settle (`enabled: !positionLoading`) before first fetch
- **`useEnrichedBusinesses(businesses, options)`** (`src/hooks/useEnrichedBusinesses.ts`) — Client-side post-processing: computes distances from GPS position, applies client-side filters (minDiscount, maxDistance, availableDay, network, cardMode, hasInstallments). Server handles ordering; this hook applies filters that can't be pushed server-side.
- **`useGeolocation`** — Wraps the browser Geolocation API; position is `null` if denied.

### Core Types (`src/types/index.ts`)

- **`Business`** — Main entity: id, name, category, location (`CanonicalLocation[]`), benefits (`BankBenefit[]`), distance fields, hasOnline flag
- **`BankBenefit`** — A single benefit: bankName, cardName, rewardRate, cuando (schedule string in Spanish), condicion, installments
- **`CanonicalLocation`** — Normalized Google Places location with lat/lng, geohash, placeDetails
- **`SearchApiResponse`** — Shape returned by `/api/search`; contains `merchants`, `intents`, `products`, and `pagination`

### Service Layer (`src/services/`)

All services extend `AbstractBaseService` with lifecycle methods (`onInitialize`, `onDestroy`) and use a `ServiceRegistry` singleton. Services use a centralized `Logger` with per-service child loggers. Key services:

- **`api.ts`** — Main API functions (`fetchBusinessesPaginated`, `fetchBusinessById`, `fetchCategories`, `fetchBanks`, `searchBusinesses`). `BASE_URL` is `''` so all calls go to Vite's proxy → `/api/*`
- **`rawBenefitsApi.ts`** — Direct access to raw `RawMongoBenefit` documents (used for featured benefits)
- **`CacheService`** — Wraps localStorage with TTL and size management
- **`DataTransformationService`** — Normalizes raw MongoDB documents into typed `Business`/`BankBenefit` shapes
- **`googlePlacesService.ts`** / **`googleMapsLoader.ts`** — Google Places enrichment (lazy-loads Maps SDK)

### Routing (Web)

All pages are lazy-loaded via `React.lazy`. Routes defined in `src/App.tsx`:
- `/home` — HomePage
- `/search` — SearchPage (manages its own scroll position; excluded from `ScrollToTop`)
- `/business/:id` — BusinessDetailPage
- `/benefit/:id/:benefitIndex?` — BenefitDetailPage
- `/map` — MapPage
- `/saved`, `/profile` — SavedPage, ProfilePage
- `/descuentos/:bank/:category/:city?` — LandingPage (SEO landing pages)

### API Layer (`api/[...path].js`)

Single catch-all Vercel serverless function routing all `/api/*` requests. Connects to:
- **MongoDB** (`confirmed_benefits` collection, `MONGODB_URI_READ_ONLY` env var)
- **Meilisearch** (search index, `MEILISEARCH_HOST` + `MEILISEARCH_API_KEY`)
- **Google Maps** (`VITE_GOOGLE_MAPS_API_KEY`)

Cache-control headers are set explicitly: 12h for metadata, 1h for content, 1m for location-sensitive responses.

### Mobile App (`mobile/`)

Shares ~90–100% of business logic with web:
- **Types** (100% reused), **utils** (100%), **services** (95%), **hooks** (90%)
- UI rebuilt from scratch: HTML/Tailwind → React Native StyleSheet
- Navigation: React Router → React Navigation (Stack + Bottom Tabs)
- Storage: `localStorage` → `AsyncStorage`
- Geolocation: browser API → Expo Location

### Tailwind Theme

Custom tokens in `tailwind.config.js`:
- Colors: `primary` (#6366F1), `blink-bg` (#F7F6F4), `blink-ink` (#1C1C1E)
- Category colors: food, fashion, travel, sport, tech, home
- Custom shadows: `soft`, `soft-md`, `soft-lg`, `inner-soft`
- Custom animations: `marquee`, `fade-in`, `slide-up`

## Environment Variables

Copy `.env.example` to `.env`:

```
VITE_SITE_URL
VITE_GA_MEASUREMENT_ID
VITE_API_BASE_URL         # API proxy target (Vite dev)
VITE_GOOGLE_MAPS_API_KEY
MONGODB_URI_READ_ONLY
DATABASE_NAME             # default: benefitsV3
MEILISEARCH_HOST
MEILISEARCH_API_KEY
MEILISEARCH_INDEX
```

## Testing

Tests use **Vitest** + **React Testing Library** + **jsdom**. Setup file at `src/test/setup.ts` mocks: `localStorage`, `sessionStorage`, `navigator.onLine`, `fetch`, and `window.matchMedia`. Tests live in `__tests__/` directories co-located with source files.

## Key Conventions

- **TypeScript strict mode** is enabled; `noUnusedLocals` and `noUnusedParameters` are enforced.
- **Filtering split**: heavy/indexed filters (bank, category, search text, online-only) are passed to the server; lightweight client-side filters (day-of-week, network, card mode, installments, discount %) are applied by `useEnrichedBusinesses`.
- **Cache key strategy**: React Query keys include the geohash (not raw coordinates) so CDN-cached responses are reused across nearby users. Only `sortByDistance: true` uses exact coordinates as cache keys.
- **Benefit schedule strings** are in Spanish (e.g., `"lunes a viernes"`, `"todos los días"`); parsing is done in `useEnrichedBusinesses` with a Spanish-to-English `dayMap`.
- **Service creation pattern**: extend `AbstractBaseService`, implement `getServiceName()`, `onInitialize()`, `onDestroy()`; obtain a logger via `Logger.getInstance().createServiceLogger(this.getServiceName())`.
- **Build flow**: `npm run build` automatically runs `seo:generate` first (via `prebuild` script) to produce static SEO files.
