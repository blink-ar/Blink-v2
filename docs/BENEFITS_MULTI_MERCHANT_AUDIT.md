# Audit: Blink-v2 consumption of `confirmed_benefits` / `merchant_assets` vs. the multi-merchant change

**Scope.** How this repo reads the shared `benefitsV3` collections, classified against the
planned additive change in benefits-backend-v2: `merchantIds: string[]` /
`merchantSnapshots: MerchantSnapshot[]` added to `confirmed_benefits`, with
`merchantId`/`merchantSnapshot` remaining as the primary merchant
(`= merchantIds[0]` / `merchantSnapshots[0]`), existing docs backfilled with
`merchantIds: [merchantId]`, a multikey index on `merchantIds`, and **no** compound
`{ merchantIds: 1, 'eligibilities.bank': 1 }` index (impossible: two array fields).

**TL;DR.**
- This repo is **read-only** against both collections. No writes to `confirmed_benefits`
  exist anywhere (the writable Mongo client only touches `user_data`,
  `push_subscriptions`, `notification_history`). Nothing in category (c) "WOULD BREAK".
- **4 query sites** in `api/[...path].js` filter `confirmed_benefits` by `merchantId` and
  must switch to `merchantIds` to see shared benefits. Two of them also group results by
  `doc.merchantId`, which must fan out over `doc.merchantIds`.
- The search index build (`npm run search:index`) reads **only `merchant_assets`** — it
  just needs a re-run after the backend rebuilds the summaries.
- New fields **will leak** into `/api/benefits`, `/api/benefits/:id` and
  `/api/benefits/nearby` responses (full-doc spread, no serializer). Harmless: no client
  has strict validation, TS typing is structural.
- No UI ever reads `merchantSnapshot` from a benefit doc; merchant names shown to users
  come from `merchant_assets`. The one snapshot-context concern is server-side, in
  `rehydrateBenefitDoc`.
- The additive plan is backwards compatible for this repo **on day one**, with one
  sequencing caveat (see §3).

---

## 1. All consumption points

### 1.1 `confirmed_benefits` readers (all in `api/[...path].js`)

| # | Site (file:line) | Endpoint | Query shape | Classification |
|---|---|---|---|---|
| 1 | `hydrateSearchMerchantsWithBenefits` — `api/[...path].js:1345-1364`, grouping at `:1368-1375` | `GET /api/search` (called at `:1615` and `:1673`) | `find({ merchantId: { $in: pageMerchantIds (≤20) }, ['eligibilities.bank': { $in: [/regex/i…] } if bank param], $and: [active $expr] }, BENEFIT_SUMMARY_PROJECTION).sort({ 'eligibilities.bank': 1, benefitTitle: 1 })`; results grouped into a Map keyed by `benefit.merchantId` | **(b) NEEDS QUERY CHANGE** — switch filter to `merchantIds: { $in: … }`, fan grouping out over `benefit.merchantIds`. Combines merchantId + `eligibilities.bank` — see §1.4 |
| 2 | `handleGetBenefits` — `api/[...path].js:1871-1922` (`'eligibilities.bank'` at `:1874`, `merchantId: { $in }` at `:1914`) | `GET /api/benefits` | `find({ ['eligibilities.bank': {$regex bank, i}], [network], [online], [$or title/description regex], [merchantId: { $in: idsFromMerchantAssets }], $and: [active $expr] }).sort({ _id: -1 }).skip().limit()` + `countDocuments(query)`. The id list comes from `merchant_assets.distinct('merchantId', …)` (`:1854`) when `category`/`search` is set | **(b) NEEDS QUERY CHANGE** for the category/search path. Combines merchantId + bank — see §1.4. Also: response spreads the full doc (leak, §1.5) and rehydrates by primary merchant only (§1.6) |
| 3 | `handleGetBenefitById` — `api/[...path].js:1955-1977` | `GET /api/benefits/:id` | `findOne({ $and: [{_id: ObjectId(id)} or {id}], [active $expr] })`, then `loadMerchantMapByIds([benefit.merchantId])` | **(a) UNAFFECTED** query-wise (lookup by `_id`/`id`). Full-doc leak (§1.5); snapshot rehydration uses primary merchant, acceptable here (no merchant context) |
| 4 | `handleGetCategories` — `api/[...path].js:1986-1993` | `GET /api/categories` | `aggregate([{$match active}, {$unwind: '$categories'}, {$group}, {$sort}])` | **(a) UNAFFECTED** (a shared benefit counts once — correct) |
| 5 | `handleGetBanks` — `api/[...path].js:2010-2021` | `GET /api/banks` | `aggregate([{$match active}, {$match EXCLUDE_MODO}, {$unwind: '$eligibilities'}, {$group: {_id: '$eligibilities.bank'}}, …])` | **(a) UNAFFECTED** |
| 6 | `handleGetStats` — `api/[...path].js:2039-2067` | `GET /api/stats` | `countDocuments` × 3 + two unwind aggregations (categories, eligibilities) | **(a) UNAFFECTED** (cosmetic: `totalBenefits` counts a shared benefit once while per-merchant views will show it under several merchants) |
| 7 | `handleGetNearbyBenefits` — `api/[...path].js:2123-2201` | `GET /api/benefits/nearby` | `aggregate([{$match active+category}, {$unwind: '$locations'}, distance calc, {$group by _id}, {$limit}])` — no merchant filter; returns near-full docs | **(a) UNAFFECTED** query-wise; full-doc leak (§1.5) |
| 8 | `handleGetBusinesses` — `api/[...path].js:2441-2461`, grouping at `:2463-2471`, zero-benefit drop at `:2492` | `GET /api/businesses` | After paging `merchant_assets`: `find({ merchantId: { $in: pageMerchantIds (≤100) }, ['eligibilities.bank': {$in regex}], ['eligibilities.subscription': X], [online: true], $and: [active $expr] }, BENEFIT_SUMMARY_PROJECTION).sort({ 'eligibilities.bank': 1, benefitTitle: 1 })`; grouped by `benefit.merchantId`; businesses with 0 benefits are dropped | **(b) NEEDS QUERY CHANGE** — the highest-impact site: the `.filter(benefits.length > 0)` at `:2492` makes the sequencing caveat in §3 user-visible. Combines merchantId + bank — see §1.4 |
| 9 | `handleMerchantSeoPage` — `api/[...path].js:2552-2562` | `GET /api/comercios/:slug--:id` (SSR SEO page, also drives `vercel.json` rewrites) | `find({ merchantId: parsed.merchantId }, BENEFIT_SUMMARY_PROJECTION).sort({ 'eligibilities.bank': 1, benefitTitle: 1 })` | **(b) NEEDS QUERY CHANGE** → `{ merchantIds: parsed.merchantId }`. Single-merchant equality on the multikey index; result set = one merchant's benefits (tens of docs); no bank filter, so no compound-index concern |

Supporting code touched by the same change (not queries):

| Site | Role | Impact |
|---|---|---|
| `BENEFIT_SUMMARY_PROJECTION` — `api/[...path].js:87-106` | Projection used by sites 1, 8, 9; includes `merchantId: 1` | Add `merchantIds: 1` so grouping can fan out |
| `rehydrateBenefitDoc` — `api/[...path].js:526-548` | Rebuilds `merchant.name`, `categories`, `locations`, `merchantId`, `merchantSnapshot` on a benefit from a `merchant_assets` doc | Caller picks the merchant via `benefit.merchantId` (primary). See §1.6 |
| `loadMerchantMapByIds` — `api/[...path].js:550-589` | `merchant_assets.find({ merchantId: { $in } })` | Unaffected itself; callers (`:1924-1927`, `:1973`) should pass all of `benefit.merchantIds` when context-aware rehydration lands |

### 1.2 `merchant_assets` readers — all **(a) UNAFFECTED**

`merchant_assets` keeps a scalar `merchantId`; none of these need code changes. They only
need the backend to **rebuild the summaries** (`benefitCount`, `activeBenefitCount`,
`banks`, `categories`, `searchProfile` previews) so secondary merchants reflect shared
benefits — then derived artifacts must be regenerated (§2, Phase 2).

| Site | Query |
|---|---|
| `loadMerchantMapByIds` — `api/[...path].js:556-588` | `find({ merchantId: { $in } })`, wide projection |
| `buildActiveMerchantSearchQuery` — `api/[...path].js:955-961` | `{ isActive: {$ne:false}, merchantId: {$exists, $type:'string'}, activeBenefitCount/benefitCount: {$gt:0} }` (+ category/banks) — note the `$type:'string'` is on **merchant_assets**, not benefit docs |
| `loadMerchantNameRescueDocs` — `api/[...path].js:1013-1046` | name/alias regex `$or` over the above, sorted by benefit counts |
| `searchFromMongoFallback` — `api/[...path].js:1436-1439` | regex `$or` over name/aliases/categories/banks/searchProfile |
| `resolveMerchantIdsForBenefitQuery` — `api/[...path].js:1854` | `distinct('merchantId', …)` — **on merchant_assets**, not confirmed_benefits, so not a (c) case |
| `handleGetBusinesses` merchant paging — `api/[...path].js:2255-2437` | filters incl. `merchantId` param, `$geoNear` on `geoPoints`, count |
| `handleMerchantSeoPage` / `handleLegacyBusinessRedirect` — `api/[...path].js:2527-2536`, `:2588-2601` | `findOne({ merchantId, isActive, benefitCount: {$gt:0} })` |
| `api/category-seo.js:308-324`, `api/landing-seo.js:426-443` | merchant lists for SSR category/landing pages |
| `scripts/search-indexer.mjs:18,77-87` | full scan of active merchants (see §1.3) |
| `scripts/generate-seo-files.mjs:149-171` | sitemap merchant list |

### 1.3 `npm run search:index` (task 4)

`scripts/search-indexer.mjs` reads **only one collection**:
`process.env.SEARCH_SOURCE_COLLECTION || 'merchant_assets'` (`:18`), filtered to active
merchants (`:77-83`), piped through `buildSearchDatasetFromMerchantDocs`
(`api/search/entities.js`). Benefit previews in the index come from
`merchant_assets.searchProfile`, never from `confirmed_benefits`. **It does not join to
confirmed_benefits → it just needs a re-run after the backend rebuilds merchant_assets.**

⚠️ **Footgun (pre-existing, flag loudly):** `.env.example:25` sets
`SEARCH_SOURCE_COLLECTION=confirmed_benefits`. If any environment actually copies that
value, the indexer scans benefit docs, `buildSearchDatasetFromMerchantDocs` drops them
all (entities.js:451 requires `merchantId && merchantName`; benefit docs have no
`merchantName`), and — because `meiliDeleteAllDocuments()` runs before upload
(`search-indexer.mjs:104`) — **the Meilisearch index gets wiped and left empty**. Fix the
example to `merchant_assets` (or delete the line) as part of this work.

The fallback search path (`searchFromMongoFallback`) and the `watch` mode change-stream
also operate on `merchant_assets` only.

### 1.4 Sites combining `merchantId` with `eligibilities.bank` (compound-index loss)

Sites **1, 2 and 8** combine them. Two mitigating facts:

- In all three, the bank predicate is a **case-insensitive regex** (`$in: [/bbva/i]` or
  `$regex`), not equality — so even today the
  `{ merchantId: 1, 'eligibilities.bank': 1 }` compound index cannot seek on the second
  key; it can at best filter within the `merchantId` bounds. The switch to the multikey
  `merchantIds` index + post-filter is therefore close to what already happens.
- The same applies to the sort `{ 'eligibilities.bank': 1, benefitTitle: 1 }` (sites 1,
  8, 9): with an `$in` on the leading key and a multikey sort field, MongoDB already
  performs a blocking sort. Nothing newly degrades.

Expected result-set sizes (docs examined per request after the merchantIds bound):

| Site | Bound | Expected size | Risk |
|---|---|---|---|
| 1 `/api/search` | benefits of ≤20 page merchants | tens–low hundreds | negligible |
| 8 `/api/businesses` | benefits of ≤100 page merchants | hundreds | negligible |
| 2 `/api/benefits` | `$in` over **all** merchants matching a category/search (can be hundreds–thousands of ids) + `countDocuments` over the same | thousands | the only spot worth watching; already the heaviest query today, and CDN-cached (`CC_CONTENT`). Post-change a doc is index-hit once per matching array entry — dedup is automatic but scanning grows slightly with multi-merchant docs |
| 9 SEO page | single merchant equality | tens | negligible |

### 1.5 API response leak (task 5)

There is no serializer/allowlist on benefit endpoints:

- `handleGetBenefits` (`rehydrateBenefitDoc` spreads `...benefit`), `handleGetBenefitById`
  (same), and `handleGetNearbyBenefits` (`$project` only removes the distance temp field)
  return the **raw Mongo doc** → after backfill, `merchantIds` and `merchantSnapshots`
  **will appear** in those JSON responses (and be CDN-cached).
- `/api/businesses` and `/api/search` are safe: benefits pass through
  `buildBusinessBenefitSummary` (`api/[...path].js:678-719`), an explicit field allowlist.

Does anything care? **No.**
- Web client: `RawMongoBenefit` (`src/types/mongodb.ts:121`) doesn't even declare
  `merchantId`; TS structural typing ignores extra fields; no zod/ajv/runtime validation
  exists anywhere in the repo (checked `package.json` and fetch paths in
  `src/services/api.ts`, `src/services/rawBenefitsApi.ts`, `src/services/APIService.ts`).
- Mobile client (`mobile/src/services/api.ts`, `rawBenefitsApi.ts`): plain `fetch` +
  `.json()`, same structural typing.

So the leak is cosmetic. Either accept it (document the fields as public) or add
`merchantIds: 0, merchantSnapshots: 0`-style projections to the three raw endpoints.

### 1.6 `merchantSnapshot.merchantName` display (task 6)

**No frontend code reads `merchantSnapshot` at all** (only producer:
`rehydrateBenefitDoc`; only other reference: a test assertion at
`src/services/__tests__/merchantFirstServerless.test.ts:127`). Merchant names users see
come from `merchant_assets` (`merchant.name` rehydrated server-side, or the
`/api/businesses`/`/api/search` business objects built from merchant docs).

The context concern is server-side: `rehydrateBenefitDoc` (`api/[...path].js:526-548`)
attaches `merchant.name`, `categories`, `locations` and a rebuilt `merchantSnapshot`
from the merchant looked up via **`benefit.merchantId` (primary)** (`:1924-1932`,
`:1973-1977`). Once site 2 switches to `merchantIds: { $in: idsForCategory }`, a benefit
matched through a *secondary* merchant would be decorated with its *primary* merchant's
name/locations/categories — the wrong context for the list the user is browsing. The fix
belongs with the query change: pick the merchant from
`benefit.merchantIds ∩ resolvedMerchantIdSet` (falling back to primary), and use the
matching `merchantSnapshots` entry when the `merchant_assets` doc is missing.

### 1.7 Category (c) WOULD BREAK — none found

- **No writes** to `confirmed_benefits` or `merchant_assets` anywhere. The writable
  client (`getWritableDb`) is used only for `user_data`, `push_subscriptions`,
  `notification_history`; benefit reads use `MONGODB_URI_READ_ONLY`.
- No `distinct('merchantId')` on `confirmed_benefits` (the one at `:1854` targets
  `merchant_assets`).
- All `merchantId: { $type: 'string' }` filters target `merchant_assets`
  (`api/[...path].js:957,1839,2257`, `api/category-seo.js:308`,
  `api/landing-seo.js:426`, `scripts/search-indexer.mjs:80`,
  `scripts/generate-seo-files.mjs:153`) — that collection keeps a scalar `merchantId`.
- The only scalar assumptions on a benefit's `merchantId` are Map keys / id fallbacks
  (`api/[...path].js:1369,2465`; `src/services/APIService.ts:425`) — the field stays a
  string, so these keep working.

---

## 2. Minimal change list for Blink-v2

**Phase 0 — now, safe before anything ships (no behavior change):**
1. Fix `.env.example:25` → `SEARCH_SOURCE_COLLECTION=merchant_assets` (or remove). (§1.3)
2. Add `merchantIds: 1` to `BENEFIT_SUMMARY_PROJECTION` (`api/[...path].js:87`) — a
   harmless no-op until the field exists.
3. Decide the leak policy for `/api/benefits*` (§1.5): accept or project out.

**Phase 1 — after backfill completes, before/with the merchant_assets rebuild that adds
shared benefits to secondary merchants** (queries can only switch once every doc has
`merchantIds`, otherwise legacy docs stop matching):
4. Switch the four filters: `:1346` → `merchantIds: { $in }`; `:1914` →
   `merchantIds: { $in }`; `:2442` → `merchantIds: { $in }`; `:2555` →
   `merchantIds: parsed.merchantId`.
5. Fan grouping out over `benefit.merchantIds ?? [benefit.merchantId]` at `:1368-1375`
   and `:2463-2471` (intersected with the page's merchant ids so a benefit isn't
   attached to off-page merchants).
6. Context-aware rehydration in `handleGetBenefits`/`rehydrateBenefitDoc` (§1.6).
7. Update test fixtures: `src/services/__tests__/merchantFirstServerless.test.ts`,
   `src/services/__tests__/searchServerless.test.ts` (mock collections need
   `merchantIds` docs and a shared-benefit case).

**Phase 2 — after the backend rebuilds `merchant_assets`:**
8. `npm run search:index` (Meilisearch re-index) — no code change needed.
9. `npm run seo:generate` runs in `prebuild` anyway; trigger a deploy/rebuild so the
   sitemap and SSR pages pick up new counts. Consider purging CDN cache for
   `/api/benefits*` and `/api/comercios/*` (12h/1h `s-maxage`).

## 3. Anything that makes the additive plan NOT backwards compatible here

Strictly additive + backfill breaks **nothing** in this repo: all queries keep returning
primary-merchant results, no validation rejects new fields, no writes exist.

One **sequencing hazard** (consistency, not a crash): the moment the backend rebuilds
`merchant_assets` so that *secondary* merchants count shared benefits
(`activeBenefitCount > 0`), but Blink still queries `confirmed_benefits` by primary
`merchantId`:
- `/api/businesses` admits the secondary merchant into the page, fetches **zero**
  benefits for it, and silently drops it at `api/[...path].js:2492` — merchants vanish
  from lists while `pagination.total` (computed from `merchant_assets`) still counts
  them, so pages can come back short / `hasMore` drifts.
- The merchant SEO page (`/comercios/…`) for a secondary merchant renders with an empty
  benefits section.
- Meilisearch (built from `searchProfile`) advertises benefits the hydration step then
  can't find.

**Mitigation:** ship Blink's Phase 1 query switch *before or together with* the
merchant_assets rebuild that credits shared benefits to secondary merchants. If the
rebuild keeps counting only primary-merchant benefits, there is no deadline at all.

Minor cosmetic drift after the switch: `/api/stats` `totalBenefits` counts shared
benefits once while per-merchant surfaces show them multiple times.

## 4. Effort estimate

| Work | Estimate |
|---|---|
| Phase 0 (env example, projection, leak decision) | ~0.5 day |
| Phase 1 query + grouping + rehydration changes (all in `api/[...path].js`) | ~1 day |
| Phase 1 test fixture updates + a shared-benefit regression test | ~0.5–1 day |
| Phase 2 re-index / redeploy / cache purge (operational) | ~0.5 day |
| **Total** | **≈ 2.5–3 dev-days**, low risk — every change is localized to one file plus tests |
