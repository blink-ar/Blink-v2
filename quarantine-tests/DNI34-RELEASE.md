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

## Self-contained offline handoff tooling
`prepare-dni34-handoff.mjs NEW_DIRECTORY PRIVATE_SNAPSHOT APPROVED_SHA EXISTING_NODE_MODULES` exports a minimal committed-HEAD whitelist, builds Vite with a clean environment (no.envfiles), removes the temporary dependency symlink, and provisions the verified server-only snapshot into the package. This avoids relying on an ignored file magically arriving in a Git deployment. No dependency install, account connection or deploy occurs.

`verify-dni34-adapter.cjs SOURCE FUNCTION_OUTPUT NEW_WORKDIR INSTALLED_ADAPTER_NODE_MODULES EXISTING_APP_NODE_MODULES` runs an already installed official@vercel/node builder with installation disabled, copies local dependencies into the isolated work directory for portable tracing, and materializes the actual Lambda files. This is a representative function bundle, NOT an invented `.vercel/output` or a cloud deployment. Requires a separate output/work directory from SOURCE. Internal PNPM links are preserved and must survive handoff archive/extraction. Supply an inert local Mongo URI for production-mode smoke tests because the existing shared handler validates that environment variable at module import; the source34 route itself makes no database calls.
