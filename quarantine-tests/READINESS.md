# Temporary Cuenta DNI1069 read quarantine: local handoff

## Identity and scope
Base: **a5c18dcb89a2766478fc1380a93cb0eafb9beab2**, confirmed production commit from authenticated Vercel inspection by the coordinating agent. Current deployment was dpl_7Li1e4hLnrNE7rBrjzjNLyugLV4f in blink-app. Work was done in an isolated worktree. No push, merge or deployment performed. **Andrés performs frontend deployments**, per the owner's instruction; root must coordinate main integration and handoff, not deploy through Andrés's browser session.

The live service is Vite + Vercel catchall `api/[...path].js`, directly querying Mongo, not backend-v2/public-api. This patch changes no database documents, merchant associations, identities, terms, permissions or credentials.

Scope is upstream Cuenta DNI promotion1069, including renewed or differently formatted identity suffixes. Namespace boundaries `cuentadni-benefit-1069(?:-|$)` and `benefit:1069(?:-|$)` do not match10690 or another bank's1069. Scoped source markers plus exact benefitId also match.1089 remains visible.

## Implemented protections
- Central read-only DB query adapter: benefit find/findOne/countDocuments/distinct and aggregation, including geoNear/search first-stage placement and joined/faceted collections. Exclusion runs before projections/counts. No raw-benefits route exists: raw client services call `/api/benefits` and `/api/benefits/:id`.
- API detail404, list/count/stats/nearby filtering. Defensive JSON filtering preserves native Date/ObjectId/Buffer serialization.
- Business cards and search hydration recompute counts/banks/maxDiscount from permitted page benefits. Fresh summaries alone receive `quarantineSummaryVersion:1`, before limiting cards to listing previews.
- Merchant SSR/bootstrap/OpenGraph/JSON-LD use filtered benefits. Category/landing pages retain names, merchant URLs and navigation, but suppress derived discount/bank/count claims with explicit unavailable text. Core SEO metrics use existing unavailable-shell semantics.
- Business/search pagination totals are `null` with `totalKnown:false`; hasMore remains a navigation hint, not a verified count. Benefit-list and statistics counts are actually filtered and remain numeric.
- Client guard covers API, bootstrap, navigation state, React Query data and card rendering. Unstamped cached summaries are suppressed even if the cached preview omitted1069; a stamp never exempts a1069 card from filtering. Null counts render 'Beneficios disponibles' or 'Resultados disponibles'.
- Minimum-discount filtering runs over permitted benefits in `useEnrichedBusinesses`, downstream of sanitized `useBenefitsData`. Search relevance still uses historical precomputed ranking signals, so ranking/pagination is not fully recomputed, but no stale percentage is rendered as an offer.
- Existing sitemap format contains merchant/category/landing URLs, not individual benefit claims; no1069 identity literal was found in public static files. No sitemap bulk rewrite performed.
- New dynamic responses use private/no-store while quarantine is enabled. This does not retroactively purge CDN or old browser caches.

## Verification
-16 Node tests passed with isolated official Mongo7 fixture (localhost27143 only): namespace/renewal boundaries, query guards, direct404, lists, business card1089 at20% rather than stale99%, numeric filtered counts, geospatial, Mongo fallback search and mocked-Meili-search plus real Mongo hydration, merchant SSR, category/landing HTML, JSON native types.
- Client focused tests and component rendering pass; the child ran43 regression tests after stale-summary hardening. A real component renders20% and not15% or the old99 count.
-83 existing serverless/search tests pass with the rollback flag off, demonstrating legacy behavior restoration.
- Vite production build passes. Existing TypeScript diagnostics remain; child comparison found no new diagnostics against base.
- No production HTTP writes or database mutations were used for verification.

## Deliberate temporary impact and remaining operational gates
Category/landing/core SEO derived summaries are unavailable, rather than inaccurate. Pagination totals on business search are unknown. Historical ranking and candidate filters may still influence which merchants are offered first. Names, locations and links remain; verified other benefits remain. These are temporary presentation/query tradeoffs, not data changes.

Root must review and integrate without overwriting concurrent main changes. Andrés must deploy. Then perform a formal CDN invalidation if available and fresh public probes of API, merchant page/bootstrap and category/landing pages. A new no-store header alone cannot revoke old cached responses. Browsers must load the new JS for the defensive client filter; already-open old tabs cannot be remotely revoked by this patch.

Rollback: server `BLINK_CUENTADNI_1069_QUARANTINE=off`; client `VITE_CUENTADNI_1069_QUARANTINE=off` requires rebuild. Coordinate both flags/deployment. Do not treat rollback as authorization to expose the known incorrect1069 applicability before that underlying issue is resolved.
