# Frontend SEO corrections, 2026-11-02

PR: https://github.com/blink-ar/Blink-v2/pull/207. Deploy owner: Andrés, per Tomás. A merge is not a deployment or Google recovery. Do not create a separate deployment path or change commit identity/permissions to bypass Vercel.

## Changes prepared

- Merchant bootstrap paints immediately and revalidates in the background. Failure/empty responses preserve useful content; route cancellation ignores late results. Refreshed same-merchant navigation state outranks old bootstrap after a rename.
- Explicit server routes retain public SSR pages, trailing slash variants, auth callback and shared benefit URLs (stable IDs and numeric legacy references). Unknown paths get HTTP 404; unknown SPA navigation gets a missing-page screen.
- Map is an interactive utility, `noindex, follow`. Account/auth/notifications are `noindex, nofollow`. HTML and HTTP headers agree before JavaScript, with their own canonical and no homepage JSON-LD. App rendering needs no database and is `private, no-store`.
- Only `/map` leaves the sitemap. No merchant eligibility, noindex or deletion policy is changed. The committed fallback URL set changes from 25,645 to 25,644, with exactly that one removal; the dynamic production sitemap must be verified separately.
- Percentage presentation has one shared contract: finite numeric `discountPercentage` is authoritative; explicit null/0 forbids percentage inference from copy. Absent field retains legacy rewardRate/valor compatibility during staged rollout, guarded against raffle titles and invalid ranges. Titles are never a numeric source. Reimbursement is labelled reimbursement, not OFF. Raffles do not create Offer schema.
- The frontend's own Mongo-backed API includes the canonical percentage in full and compact responses. Home, search filters, map, listing cards, detail, landing selection and SSR use the same helpers. Materialized maximum fields do not override benefit facts. The dormant NearbyBusinesses component no longer invents 10%, a street or a 200m distance.
- Date-only expiry includes the full Argentine day in frontend API query, SSR and UI. Timestamp expiry still uses its exact instant. No missing-expiry policy change.

## Backend contract and dependencies

Read directly from catalog task commit `c98868051637d4afdf12db7f48188d99109deb54`: `services/merchantBenefitPreviews.ts` exposes `discountPercentage: number | null`; it is not parsed from `otherDiscounts` or title. The frontend's own API now emits the same field from canonical benefit records, so its primary path does not require a coordinated breaking API migration. Consumers remain compatible with older backend payloads where the field is absent.

The backend catalog commit was still local/unpublished when inspected. Backend deployment, persistent summary reconciliation, retention-to-summary durability and provider classification remain separate prerequisites for claiming full catalog accuracy. Current summary counts, provider freshness and eligibility cannot be certified by this UI patch. Do not represent those changes as deployed or repaired.

## Review and validation

Three initial review findings were confirmed and corrected: shared benefit links falling into 404, `/search/` acquiring noindex after hydration, and old bootstrap overwriting a fresh canonical rename. Regression tests reproduce all three cases.

Validation is captured in local `evidence/`: full Vitest suite, Vite/PWA build, lint, and a pre-change GET-only HTTP snapshot of 16 production paths without JavaScript or synthetic analytics events. TypeScript full-project checking has extensive pre-existing errors; compare against the archived base and do not call it a clean typecheck. New shared JS modules include declarations.

## Handoff and acceptance

1. Complete review and required `pnpm build and test` CI on the exact head; resolve confirmed fixed review threads before merge. No admin bypass.
2. Once merged, Tomás asks Andrés to deploy the intended main SHA through the established frontend process. Vercel rejected automated previews for `blink-app` and `blink-v2` due to project permission; GitHub correctly recognizes TomasCImach and grants repository admin. GitHub admin is not proof of Vercel project access; team membership/login linkage was not available for inspection.
3. Andrés verifies the production build has its existing dynamic sitemap data source. Compare all child sitemap URL sets and the frozen affected cohort, not the committed fallback count alone. Do not accept an unexpected collapse from the current roughly 220k production URLs.
4. Run `python3 scripts/seo-release-smoke.py https://www.blinkapp.com.ar` after deployment. Verify HTML/headers/canonical, static assets, public SSR, legacy benefit refresh and auth callback. Record immutable deployment, main SHA, alias, UTC activation and technical acceptance separately from merge time. No T0 exists until production activation.
5. Measure controlled API/client/SSR propagation with authorized catalog update and warm/cold-cache observations. Existing 24h SSR CDN TTL and 7d SWR are unchanged. This client fix does not establish an SSR freshness SLA. Avoid a broad TTL reduction without cost/load measurements.
6. Import the confirmed manifest into the parent's GSC measurement kit. All merchant pages receive the frontend treatment: no untreated merchant control exists; home/landings/categories are trend references only. No new analytics/credentials/events were added.

## Rollback

Baseline main: `b849427bc76989bfbfe0e0ee4dea294a899e50da`. Last observed successful production deployment: `https://blink-pdglzieys-andresimachs-projects.vercel.app`, GitHub deployment 7234742668, accepted 2026-10-21T19:02:22Z. No migration or catalog writes accompany this frontend change. If a deployed regression occurs, Andrés reverts/promotes through the established process and records the actual rollback UTC; no rollback has been performed here.
