# Source34 dedicated text directory: implemented, not deployed

Base30b9981. Legacy1069 remains quarantined. New source-native view is independent of merchant_assets and all legacy benefits APIs. No benefit IDs, mappings, geocoding, public search links or notifications are created.

Routes: GET/HEAD `/api/cuenta-dni/fuente-34` (JSON) and `/cuenta-dni/fuente-34` (server-rendered HTML through Vercel catchall rewrite). Dedicated Vercel route is before fallback. No SPA rendering or client hydration is needed: Previous/Next are full document navigation, so no async response race. No new links from other promotions. Routes are noindex, no-store; PWA navigation fallback excludes the view. Already open screens cannot be remotely revoked; next request after disabling returns404 without prior contents.

## Artifact and release gates
The backend exporter produces evidence-only schema1 (`publicationAuthorized:false`), version `source34-<SHA256 of captureSHA + descriptorSHA + legalSHA JSON>`, explicit source34/promotion1069/provider branch identities, observedAt, legal source-specific terms, evidence hashes and text-only branches. The frontend validates exact official legal SHA, dates/weekdays/cap and known source URL. It strips all unrecognized fields, including geography and merchant associations. Maximum2MiB,2000 rows, unique IDs<=128characters, name512/address1024/locality512characters.

Production release requires a separately approved artifact and activation. This commit does NOT provide that approval. Do not infer it from snapshot data or `publicationAuthorized:false`.

Default disabled: `BLINK_DNI34_PUBLIC_ENABLED` absent/off/true all yield404 with zero file/DB reads. Only exact`on`, valid file path and independently pinnedSHA enable evaluation. No queryparam bypass. No Mongo access in the new route.

Freshness gate: observedAt cannot be future; maximum age48hours default. `BLINK_DNI34_MAX_AGE_HOURS` allowed1–168. Validity checked on Buenos Aires calendar day (2026-09-01 through2026-12-29 inclusive). Stale/expired/invalid evidence returns503 without source data. There is no auto-refresh or implicit ongoing freshness promise.

Pagination: fixed50, exact snapshotversion required after page1; changed version409 requires starting again. Metadata reports observed rows, never exact current directory completeness. HTML uses complete legal text once per page and no inferred map/distance.

## Packaging for Andrés, after review and authorization
1. Produce and independently verify the backend artifact outsideGit. Do not put it inpublic/dist.
2. Run `node scripts/stage-dni34-snapshot.mjs PRIVATE_SOURCE APPROVED_SHA256`. This validates and copies only to ignored`server-artifacts/dni34.json` (0600).
3. Vercel function includeFiles includes `dist/index.html` and `server-artifacts/*.json`; these files are server-only. A git-only deployment will NOT include an ignored local artifact: Andrés must stage it in the deployment/build environment or use the explicitly reviewed local packaging flow. No download/upload automation or credential changes are provided here.
4. Set runtime path to the packaged`server-artifacts/dni34.json`, correspondingSHA and separately approved flag. Deployments remain Andrés's responsibility. Missing artifact stays503; disabled remains404.
5. Verify routes/caches against deployed build and legacy1069 still absent;1089 unchanged. Snapshot SHA and source timestamps must match the review. No live release performed.

Rollback: turn flagoff, then verify JSON and HTML404 with no-store; remove artifact/config when appropriate. This affects only the dedicated route, never removes legacyquarantine or edits stored data. Staging does not activate any flag.

## Verification
Synthetic artifacts only in committed tests. Official legal text fixture is the pinned source document, not branch data. Unit/integrated tests cover contract, valid pin but incorrect terms/source/version, duplicates, pagination50, geo field stripping, HTMLescaping, freshness/expiry, rollback404, Vercel rewritten path and actual localhostHTTP without dotenv or database. Runtime exact exported real artifact validated read-only separately; real data are not committed.
