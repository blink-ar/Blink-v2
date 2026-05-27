#!/usr/bin/env node
/**
 * Download bank logos from Modo raw benefits in MongoDB.
 *
 * Reads `modoDetail.banks[].image` URLs grouped by `hub_bank_id`,
 * downloads each unique logo to `public/banks/{hub_bank_id}.{ext}`,
 * and writes a manifest at `src/data/bankLogosManifest.json` so the
 * <BankLogo /> component can look up the right file.
 *
 * Usage:
 *   node scripts/download-bank-logos.mjs
 *   node scripts/download-bank-logos.mjs --force
 *   node scripts/download-bank-logos.mjs --dry-run
 *   node scripts/download-bank-logos.mjs --collection raw_benefits_modo
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'public', 'banks');
const MANIFEST_PATH = path.join(REPO_ROOT, 'src', 'data', 'bankLogosManifest.ts');
const DATABASE_NAME = process.env.DATABASE_NAME || 'benefitsV3';

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const out = { force: false, dryRun: false, collection: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force' || a === '-f') out.force = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--collection') out.collection = argv[++i];
    else if (a.startsWith('--collection=')) out.collection = a.split('=')[1];
  }
  return out;
}

function loadEnvFile(fileName) {
  const filePath = path.resolve(REPO_ROOT, fileName);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const sep = trimmed.indexOf('=');
    if (sep <= 0) continue;
    const key = trimmed.slice(0, sep).trim();
    let value = trimmed.slice(sep + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const MONGO_URI = (process.env.MONGODB_URI_READ_ONLY || process.env.MONGODB_URI || '').trim();
if (!MONGO_URI) {
  console.error('Missing MONGODB_URI_READ_ONLY (or MONGODB_URI) in env.');
  process.exit(1);
}

async function detectCollection(db) {
  if (args.collection) return args.collection;
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  for (const { name } of collections) {
    const hit = await db.collection(name).findOne(
      { 'modoDetail.banks.image': { $exists: true, $ne: '' } },
      { projection: { _id: 1 } }
    );
    if (hit) return name;
  }
  return null;
}

async function aggregateBanks(db, collectionName) {
  return db.collection(collectionName).aggregate([
    { $match: { 'modoDetail.banks.image': { $exists: true, $ne: '' } } },
    { $unwind: '$modoDetail.banks' },
    {
      $match: {
        'modoDetail.banks.image': { $exists: true, $ne: '' },
        'modoDetail.banks.hub_bank_id': { $exists: true, $nin: ['', null] }
      }
    },
    {
      $group: {
        _id: '$modoDetail.banks.hub_bank_id',
        image: { $first: '$modoDetail.banks.image' },
        name: { $first: '$modoDetail.banks.name' },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
}

function extFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const m = pathname.match(/\.([a-zA-Z0-9]{2,5})$/);
    return m ? `.${m[1].toLowerCase()}` : '';
  } catch {
    return '';
  }
}

function extFromContentType(ct) {
  if (!ct) return '';
  const type = ct.split(';')[0].trim().toLowerCase();
  const map = {
    'image/svg+xml': '.svg',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif'
  };
  return map[type] || '';
}

function isSafeSlug(slug) {
  return /^[a-z0-9][a-z0-9_-]*$/i.test(slug);
}

async function downloadOne(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = extFromUrl(url) || extFromContentType(res.headers.get('content-type')) || '.png';
    return { buf, ext };
  } finally {
    clearTimeout(timeout);
  }
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  try {
    const db = client.db(DATABASE_NAME);
    const collectionName = await detectCollection(db);
    if (!collectionName) {
      console.error('Could not find a collection with `modoDetail.banks.image`.');
      console.error('Pass --collection <name> to override.');
      process.exit(1);
    }
    console.log(`Using collection: ${collectionName}`);

    const rows = await aggregateBanks(db, collectionName);
    if (rows.length === 0) {
      console.error('No banks found with image + hub_bank_id.');
      process.exit(1);
    }
    console.log(`Found ${rows.length} distinct hub_bank_id with image.\n`);

    if (!args.dryRun) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
    }

    const manifest = {};
    let downloaded = 0, skipped = 0, failed = 0;

    for (const row of rows) {
      const slug = String(row._id || '').trim();
      const url = String(row.image || '').trim();
      const name = String(row.name || '').trim();

      if (!isSafeSlug(slug)) {
        console.log(`✗ ${pad(slug, 24)} unsafe slug, skipping`);
        failed++;
        continue;
      }

      if (args.dryRun) {
        console.log(`• ${pad(slug, 24)} ${url}`);
        manifest[slug] = { file: `${slug}${extFromUrl(url) || '.png'}`, name };
        continue;
      }

      const existing = fs.readdirSync(OUTPUT_DIR).find((f) => f.startsWith(`${slug}.`));
      if (existing && !args.force) {
        console.log(`= ${pad(slug, 24)} skip (exists: ${existing})`);
        manifest[slug] = { file: existing, name };
        skipped++;
        continue;
      }

      try {
        const { buf, ext } = await downloadOne(url);
        if (existing && existing !== `${slug}${ext}`) {
          fs.unlinkSync(path.join(OUTPUT_DIR, existing));
        }
        const file = `${slug}${ext}`;
        fs.writeFileSync(path.join(OUTPUT_DIR, file), buf);
        manifest[slug] = { file, name };
        console.log(`✓ ${pad(slug, 24)} ${pad(file, 32)} ${(buf.length / 1024).toFixed(1)} KB (n=${row.count})`);
        downloaded++;
      } catch (err) {
        console.log(`✗ ${pad(slug, 24)} ${err.message}`);
        failed++;
      }
    }

    const sortedManifest = Object.fromEntries(
      Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))
    );

    if (!args.dryRun) {
      const tsBody =
        '// Auto-generated by scripts/download-bank-logos.mjs. Do not edit by hand.\n' +
        'export interface BankLogoEntry {\n' +
        '  file: string;\n' +
        '  name: string;\n' +
        '}\n\n' +
        'export const bankLogosManifest: Record<string, BankLogoEntry> = ' +
        JSON.stringify(sortedManifest, null, 2) +
        ';\n';
      fs.writeFileSync(MANIFEST_PATH, tsBody);
      console.log(`\nManifest written: ${path.relative(REPO_ROOT, MANIFEST_PATH)}`);
    }

    console.log(`\nDone. downloaded=${downloaded} skipped=${skipped} failed=${failed} total=${rows.length}`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
