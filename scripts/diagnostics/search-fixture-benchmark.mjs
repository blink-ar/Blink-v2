// Local fixtures only. No network or database connections.
// Compare the same endpoint on an immutable Git base and the working tree.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
const base = process.argv[2] || 'c99b6f9943d407781e38401f84e86187a7b8a287';
const baselinePath = new URL(`../../api/.search-benchmark-base-${process.pid}.js`, import.meta.url);
fs.writeFileSync(baselinePath, execFileSync('git', ['show', `${base}:api/[...path].js`], { encoding: 'utf8' }));
const previousFetch = globalThis.fetch;
const previousHost = process.env.MEILISEARCH_HOST;
const previousKey = process.env.MEILISEARCH_API_KEY;
process.env.MEILISEARCH_HOST = 'https://fixture.invalid';
delete process.env.MEILISEARCH_API_KEY;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const fixture = {
  merchantId: 'fixture-cafe', merchantName: 'Café Central', merchantKey: 'cafe-central',
  categories: ['gastronomia'], banks: [], locations: [], activeBenefitCount: 1,
  searchProfile: { aliases: ['cafe central'], description: 'Café en Tucumán', productTags: ['cafe'], intentTags: [],
    // Models a legacy embedded preview / unused profile field, not a live document.
    benefits: Array.from({ length: 40 }, () => ({ description: 'x'.repeat(1024), raw: 'y'.repeat(1024) })),
    unusedMetadata: 'z'.repeat(1024),
  },
};
function project(doc, projection) {
  if (!projection) return doc;
  const out = {};
  for (const [path, include] of Object.entries(projection)) {
    if (!include) continue;
    const [top, nested] = path.split('.');
    if (doc[top] === undefined) continue;
    if (nested) { if (doc[top][nested] !== undefined) (out[top] ||= {})[nested] = doc[top][nested]; }
    else out[top] = doc[top];
  }
  return out;
}
async function run(handler) {
  delete globalThis.__blinkProviderCatalog;
  let transferredBytes = 0;
  let merchantFinds = 0;
  let meiliCalls = 0;
  globalThis.fetch = async url => {
    if (!String(url).startsWith('https://fixture.invalid/')) throw new Error('Unexpected external fetch in fixture');
    meiliCalls += 1;
    await sleep(60);
    return new Response(JSON.stringify({ hits: [], estimatedTotalHits: 0 }), { headers: { 'content-type': 'application/json' } });
  };
  const db = { collection(name) { return { find(query, options) {
    const exact = name === 'merchant_assets' && merchantFinds++ === 0;
    const rows = exact ? [project(fixture, options?.projection)] : [];
    const cursor = { sort() { return cursor; }, limit() { return cursor; }, async toArray() {
      if (name === 'merchant_assets') { await sleep(20); transferredBytes += Buffer.byteLength(JSON.stringify(rows)); }
      return rows;
    } };
    return cursor;
  } }; } };
  const res = { statusCode: 0, body: '', status(code) { this.statusCode = code; return this; }, setHeader() {}, send(body) { this.body = body; } };
  const start = performance.now();
  await handler({ method: 'GET' }, res, new URL('https://local.invalid/api/search?q=café%20central'), db);
  return { elapsedMs: Math.round(performance.now() - start), transferredBytes, meiliCalls, merchantFinds, response: JSON.parse(res.body) };
}
try {
  const { handleSearch: baseline } = await import(pathToFileURL(baselinePath.pathname).href);
  const { handleSearch: current } = await import('../../api/[...path].js');
  const before = [], after = [];
  for (let i = 0; i < 5; i++) { before.push(await run(baseline)); after.push(await run(current)); }
  if (JSON.stringify(before[0].response) !== JSON.stringify(after[0].response)) throw new Error('Fixture endpoint responses differ');
  const compact = runs => runs.map(({ response, ...metrics }) => metrics);
  const report = { base, measuredAt: new Date().toISOString(), kind: 'controlled local fixture; not production latency or size', assumptions: '3 Meili sections at 60ms each; 2 Mongo rescue reads at 20ms each; one synthetic merchant with unused/legacy searchProfile payload', before: compact(before), after: compact(after), identicalResponse: true };
  fs.mkdirSync('evidence', { recursive: true });
  fs.writeFileSync('evidence/search-fixture-benchmark.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  fs.unlinkSync(baselinePath);
  globalThis.fetch = previousFetch;
  if (previousHost === undefined) delete process.env.MEILISEARCH_HOST; else process.env.MEILISEARCH_HOST = previousHost;
  if (previousKey === undefined) delete process.env.MEILISEARCH_API_KEY; else process.env.MEILISEARCH_API_KEY = previousKey;
}
