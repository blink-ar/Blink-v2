# Mobile App Migration Estimate — Blink-v2 (Bank Benefits Finder)

## Current Application Summary

| Metric | Value |
|--------|-------|
| **Type** | React 18 PWA (TypeScript) |
| **Total TS/TSX files** | 118 |
| **Lines of code** | ~21,450 |
| **Components** | 58 |
| **Pages/Screens** | 2 main (Home with 2 tabs, Benefit Detail) |
| **Custom Hooks** | 7 |
| **Services** | 16+ (API, cache, HTTP, geolocation, Google Maps/Places) |
| **Test Files** | 26 |
| **Backend** | REST API (MongoDB on Render) — no changes needed |
| **Auth** | None |
| **Real-time** | None (HTTP polling via React Query) |
| **Routing Complexity** | Low (2 routes, tab navigation) |

---

## Migration Options

### Option A — React Native (Recommended)

**Why it fits this project:**
- Existing React + TypeScript codebase means most business logic, hooks, services, types, and data transformation code can be **reused directly** (~40-50% of code).
- Single codebase produces both Android and iOS apps.
- React Query, Axios, and most npm dependencies work in React Native without modification.
- Google Maps integration has mature React Native libraries (`react-native-maps`).

**What gets reused as-is:**
- All TypeScript types/interfaces (3 files)
- All service-layer code: API client, HTTPClient, CacheService, DataTransformationService (~16 files, ~240 KB)
- All custom hooks (7 files, ~55 KB)
- All utility functions (8 files, ~148 KB)
- React Query setup and query key structure
- Mock data and generators

**What must be rewritten:**
- All 58 UI components (JSX → React Native components, Tailwind CSS → StyleSheet/NativeWind)
- Navigation (React Router → React Navigation)
- Google Maps integration (`react-native-maps` instead of Google Maps JS SDK)
- Geolocation (browser API → `react-native-geolocation-service`)
- Caching (localStorage → AsyncStorage or MMKV)
- PWA features replaced by native equivalents (push notifications, offline storage)
- CSS/Tailwind → React Native StyleSheet or NativeWind
- Build configuration (Vite → Metro bundler, Xcode, Android Studio)

#### Cost Estimate — React Native

| Phase | Description | Estimated Cost (USD) |
|-------|-------------|---------------------|
| **1. Project Setup** | React Native init, TypeScript config, navigation, dependency setup, CI/CD | $1,500 – $2,500 |
| **2. UI Component Migration** | Rewrite 58 components from HTML/Tailwind to React Native (StyleSheet or NativeWind) | $6,000 – $10,000 |
| **3. Service Layer Adaptation** | Adapt caching (AsyncStorage), geolocation (native), network detection | $1,500 – $2,500 |
| **4. Maps & Location** | `react-native-maps` integration, nearby businesses, place details | $2,000 – $3,500 |
| **5. Navigation** | React Navigation setup, tab navigation, deep linking, scroll restoration | $1,000 – $1,500 |
| **6. Native Features** | Push notifications, app icons, splash screen, app store assets | $1,500 – $2,500 |
| **7. Testing** | Rewrite/adapt 26 test files, device testing on iOS + Android | $2,000 – $3,000 |
| **8. App Store Deployment** | Apple Developer account ($99/yr), Google Play ($25 one-time), store listings, review process | $500 – $1,000 |
| **Total** | | **$16,000 – $26,500** |

> **Freelancer rate assumption:** $40–$80/hr (mid-level React Native developer).
> **Agency rate assumption:** Agencies typically charge 1.5x–2.5x the freelancer range.

---

### Option B — Flutter

**Trade-offs vs React Native:**
- Entire codebase must be rewritten in Dart (no code reuse from React/TypeScript).
- Excellent UI performance and consistency across platforms.
- Smaller developer pool than React Native.

#### Cost Estimate — Flutter

| Phase | Description | Estimated Cost (USD) |
|-------|-------------|---------------------|
| **Full Rewrite** | All logic, UI, services, and tests rewritten in Dart | $22,000 – $38,000 |
| **App Store Deployment** | Same as above | $500 – $1,000 |
| **Total** | | **$22,500 – $39,000** |

> Higher cost due to zero code reuse from the existing TypeScript/React codebase.

---

### Option C — Native (Swift + Kotlin) — Two Separate Apps

#### Cost Estimate — Fully Native

| Platform | Estimated Cost (USD) |
|----------|---------------------|
| **iOS (Swift/SwiftUI)** | $20,000 – $35,000 |
| **Android (Kotlin/Jetpack Compose)** | $20,000 – $35,000 |
| **Total** | **$40,000 – $70,000** |

> Highest cost. Two separate codebases to maintain. Best performance but overkill for this app's complexity.

---

### Option D — Capacitor/Ionic (Wrap the existing PWA)

**Fastest and cheapest option.** Wraps the existing web app in a native shell with access to native APIs (camera, geolocation, push notifications).

#### Cost Estimate — Capacitor

| Phase | Description | Estimated Cost (USD) |
|-------|-------------|---------------------|
| **1. Capacitor Setup** | Add Capacitor to existing Vite project, configure iOS + Android | $500 – $1,000 |
| **2. Native Plugin Integration** | Geolocation, push notifications, status bar, splash screen | $1,000 – $2,000 |
| **3. UI Adjustments** | Safe area insets, native navigation feel, platform-specific tweaks | $1,000 – $2,000 |
| **4. Testing & Deployment** | Device testing, app store submission | $1,000 – $1,500 |
| **Total** | | **$3,500 – $6,500** |

> **Trade-off:** Not truly native. Performance is web-level, not native-level. However, for a content-browsing app like this (read-heavy, no complex animations or heavy computation), the difference is negligible for most users.

---

## Comparison Summary

| Criteria | React Native | Flutter | Native (Swift+Kotlin) | Capacitor |
|----------|-------------|---------|----------------------|-----------|
| **Cost** | $16K – $27K | $22K – $39K | $40K – $70K | $3.5K – $6.5K |
| **Code Reuse** | ~40-50% | 0% | 0% | ~95% |
| **Performance** | Near-native | Near-native | Native | Web-level |
| **Maintenance** | 1 codebase | 1 codebase | 2 codebases | 1 codebase (shared with web) |
| **Developer Pool** | Large | Medium | Large | Large (web devs) |
| **Best For** | Native feel + code reuse | UI consistency | Maximum performance | Fastest time to market |

---

## Recommendation

Given the characteristics of **Blink-v2**:

1. **If budget is tight → Capacitor ($3.5K – $6.5K).** This app is read-heavy with simple UI interactions (scrolling lists, filtering, viewing details, maps). A Capacitor wrapper would deliver a solid mobile experience with minimal effort and near-complete code reuse.

2. **If native feel matters → React Native ($16K – $27K).** The existing TypeScript services, hooks, types, and utilities transfer directly. Only the UI layer needs to be rebuilt. This gives the best balance of quality, cost, and code reuse.

3. **Avoid Flutter and fully native** for this project — the app's complexity doesn't justify the cost premium, and you lose all existing code investment.

---

## Key Factors That Keep Costs Low

- **No authentication system** — No login/signup flows, OAuth, token management
- **No payment processing** — No Stripe/payment integration
- **No real-time features** — No WebSockets, no chat, no live updates
- **Simple routing** — Only 2 pages with tab navigation
- **REST API is ready** — Backend requires zero changes for mobile
- **No user-generated content** — No image uploads, forms, or rich text editors
- **Well-structured codebase** — Clean separation of concerns makes migration straightforward

## Key Factors That Could Increase Costs

- Adding **push notifications** (requires backend changes for FCM/APNs)
- Adding **user authentication** in the future
- **Offline-first** functionality with local database (SQLite/Realm)
- **Advanced map features** (directions, clustering, custom markers)
- **App store optimization** and marketing assets
- **Ongoing maintenance** (iOS/Android OS updates, dependency updates): budget ~$2K–$5K/year

---

*Generated: February 2026*
*Based on analysis of the Blink-v2 codebase at current state*
