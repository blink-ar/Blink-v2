// Explicit opt-in diagnostic: public GET samples, listIndexes and queryPlanner.
// Never executes index/data writes or executionStats. Outputs no credentials.
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { MongoClient } from 'mongodb';
import { handleSearch } from '../../api/[...path].js';

if (process.env.BLINK_SEARCH_READ_ONLY_PROBE !== '1') throw new Error('Set BLINK_SEARCH_READ_ONLY_PROBE=1 to run the read-only diagnostic');
const report = { observedAt: new Date().toISOString(), publicSamples: [], indexes: {}, plans: [], errors: [] };
for (const q of ['café', 'heladerías', 'sanguches']) {
  const started = performance.now();
  try {
    const response = await fetch(`https://blinkapp.com.ar/api/search?${new URLSearchParams({ q, limit: '5' })}`, { signal: AbortSignal.timeout(12000) });
    const body = await response.text();
    let data; try { data = JSON.parse(body); } catch { data = {}; }
    report.publicSamples.push({ q, status: response.status, elapsedMs: Math.round(performance.now() - started), bytes: Buffer.byteLength(body), source: data.source, total: data.pagination?.totalMerchants, names: data.merchants?.slice(0, 5).map(m => m.merchantName), reasons: data.merchants?.slice(0, 5).map(m => m.reasons) });
  } catch (e) { report.errors.push({ area: 'public', q, name: e.name }); }
}

// Capture actual query shapes from the local endpoint against an inert fake DB.
// No production benefit or merchant records are loaded for this step.
const queries = [];
const fakeDb = { collection(name) { return { find(query, options) {
  const entry = name !== 'providers' ? { collection: name, query, projection: options?.projection } : null;
  if (entry) queries.push(entry);
  const cursor = { sort(value) { this.sortSpec = value; return this; }, limit(value) { this.limitNum = value; return this; }, async toArray() { return []; } };
  if (entry) Object.assign(entry, { cursor });
  return cursor;
} }; } };
const oldHost = process.env.MEILISEARCH_HOST;
process.env.MEILISEARCH_HOST = '';
const oldError = console.error;
console.error = () => {};
try {
  await handleSearch({ method: 'GET' }, { status() { return this; }, setHeader() {}, send() {} }, new URL('https://local.invalid/api/search?q=café&limit=5'), fakeDb);
} finally { console.error = oldError; if (oldHost === undefined) delete process.env.MEILISEARCH_HOST; else process.env.MEILISEARCH_HOST = oldHost; }

const envFile = process.argv[2];
if (!envFile) throw new Error('Pass the existing frontend env file path; credentials stay in memory');
const config = {};
for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*(MONGODB_URI_READ_ONLY|DATABASE_NAME)\s*=\s*(.*?)\s*$/);
  if (match) config[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}
if (!config.MONGODB_URI_READ_ONLY || config.MONGODB_URI_READ_ONLY.includes('[SENSITIVE]')) throw new Error('Existing read-only Mongo connection is unavailable');
const client = new MongoClient(config.MONGODB_URI_READ_ONLY, { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 });
function simplify(plan) {
  if (!plan || typeof plan !== 'object') return plan;
  if (Array.isArray(plan)) return plan.map(simplify);
  const out = {};
  for (const key of ['stage', 'indexName', 'direction', 'inputStage', 'inputStages', 'queryPlan', 'isMultiKey', 'keyPattern']) if (key in plan) out[key] = simplify(plan[key]);
  return Object.keys(out).length ? out : plan;
}
try {
  await client.connect();
  const db = client.db(config.DATABASE_NAME || 'benefitsV3');
  for (const name of ['merchant_assets', 'confirmed_benefits']) {
    const indexes = await db.collection(name).listIndexes({ maxTimeMS: 1500 }).toArray();
    report.indexes[name] = indexes.map(({ name, key, unique, sparse, partialFilterExpression, collation }) => ({ name, key, unique, sparse, partialFilterExpression, collation }));
  }
  for (const entry of queries.slice(0, 4)) {
    let cursor = db.collection(entry.collection).find(entry.query, { projection: entry.projection, maxTimeMS: 1500 }).limit(entry.cursor.limitNum || 5);
    if (entry.cursor.sortSpec) cursor = cursor.sort(entry.cursor.sortSpec);
    const plan = await cursor.explain('queryPlanner');
    report.plans.push({ collection: entry.collection, limit: entry.cursor.limitNum, sorted: !!entry.cursor.sortSpec, winningPlan: simplify(plan.queryPlanner.winningPlan), rejectedPlans: plan.queryPlanner.rejectedPlans?.length, note: 'queryPlanner only; no execution/keysExamined/docsExamined measured' });
  }
} catch (e) { report.errors.push({ area: 'mongo', name: e.name, code: e.code }); }
finally { await client.close(); }
fs.mkdirSync('evidence', { recursive: true });
fs.writeFileSync('evidence/search-read-only.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
