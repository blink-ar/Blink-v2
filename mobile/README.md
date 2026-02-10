# Blink Benefits - Mobile App

React Native (Expo) mobile application for Android and iOS, migrated from the Blink-v2 web PWA.

## Tech Stack

- **Expo SDK 54** (React Native 0.81)
- **React 19** + **TypeScript 5.9**
- **React Navigation 7** (Native Stack + Bottom Tabs)
- **TanStack React Query 5** (data fetching & caching)
- **Expo Location** (native geolocation)
- **AsyncStorage** (persistent caching)
- **Lucide React Native** (icons)
- **React Native Maps** (map integration)

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on specific platform
npm run android
npm run ios
```

## Project Structure

```
mobile/
├── App.tsx                      # Root component with providers
├── src/
│   ├── types/                   # TypeScript interfaces (shared with web)
│   │   ├── index.ts             # Business, BankBenefit, CanonicalLocation
│   │   ├── mongodb.ts           # RawMongoBenefit, transform functions
│   │   └── navigation.ts        # React Navigation type definitions
│   ├── constants/               # App constants and theme
│   │   ├── index.ts             # API URL, category/bank data
│   │   └── theme.ts             # Colors, spacing, typography, shadows
│   ├── services/                # API layer (adapted from web)
│   │   ├── api.ts               # Main API client (fetchBusinesses, etc.)
│   │   └── rawBenefitsApi.ts    # Raw benefit data access
│   ├── hooks/                   # Custom React hooks
│   │   ├── useBenefitsData.ts   # Main data hook with React Query
│   │   ├── useGeolocation.ts    # Expo Location with caching
│   │   └── useEnrichedBusinesses.ts  # Business enrichment & filtering
│   ├── utils/
│   │   └── distance.ts          # Haversine distance calculation
│   ├── components/
│   │   ├── ui/                  # Base UI (Skeleton, LoadingSpinner, GradientBadge)
│   │   ├── cards/               # BusinessCard, BenefitCard
│   │   ├── filters/             # SearchBar, FilterMenu, CategoryGrid, BankGrid
│   │   ├── Header.tsx           # App header
│   │   ├── ActiveOffers.tsx     # Horizontal scrolling offers
│   │   ├── FeaturedBenefits.tsx # Hero featured benefit banner
│   │   ├── BankBenefitGroup.tsx # Collapsible bank benefit groups
│   │   ├── StoreHeader.tsx      # Store detail header with back nav
│   │   ├── StoreInformation.tsx # Store info, locations, contact
│   │   └── BenefitDetailModal.tsx # Benefit detail bottom sheet
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Main screen (Inicio + Beneficios tabs)
│   │   └── BenefitDetailScreen.tsx  # Store/benefit detail screen
│   └── navigation/
│       └── index.tsx            # Stack + Tab navigator setup
```

## What Was Reused from Web

- **Types** (100%): All TypeScript interfaces and transform functions
- **Services** (95%): API client, raw benefits API (removed `import.meta.env`)
- **Hooks** (90%): useBenefitsData, useEnrichedBusinesses (useGeolocation rewritten for Expo)
- **Utils** (100%): Distance calculation, formatting
- **Business Logic** (100%): Filtering, sorting, data transformation

## What Was Rebuilt for Native

- All UI components (HTML/Tailwind → React Native StyleSheet)
- Navigation (React Router → React Navigation)
- Geolocation (browser API → Expo Location)
- Caching (localStorage → AsyncStorage)
- Scroll/list rendering (div → FlatList with infinite scroll)
- Modals (CSS → React Native Modal)

## Backend

Uses the same REST API: `https://benefits-backend-v2-public.onrender.com`

No backend changes required.
