import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';
import {
  buildMeiliSynonyms,
  buildSearchDatasetFromMerchantDocs
} from '../api/search/entities.js';
import {
  meiliAddDocuments,
  meiliDeleteAllDocuments,
  meiliEnsureIndex,
  meiliHealth,
  meiliUpdateSettings,
  meiliUpdateSynonyms,
  meiliWaitForTask
} from '../api/search/meilisearch.js';

const COLLECTION = process.env.SEARCH_SOURCE_COLLECTION || 'merchant_assets';
const DATABASE_NAME = process.env.DATABASE_NAME || 'benefitsV3';
const BATCH_SIZE = Number.parseInt(process.env.SEARCH_INDEX_BATCH_SIZE || '500', 10);

const MEILI_SETTINGS = {
  searchableAttributes: [
    'merchantName',
    'aliases',
    'productTags',
    'intentTags',
    'description',
    'searchText',
    'displayLabel',
    'synonyms',
    'productTerm'
  ],
  filterableAttributes: ['entityType', 'categories', 'banks', 'online', 'merchantId'],
  sortableAttributes: ['popularity', 'maxDiscount'],
  rankingRules: [
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness',
    'popularity:desc',
    'maxDiscount:desc'
  ],
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: {
      oneTypo: 4,
      twoTypos: 8
    }
  }
};

function loadEnvFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function getActiveMerchantMatch() {
  return {
    isActive: { $ne: false },
    merchantId: { $exists: true, $type: 'string' },
    activeBenefitCount: { $gt: 0 }
  };
}

async function loadMerchants(db) {
  return db.collection(COLLECTION).find(getActiveMerchantMatch()).toArray();
}

async function applyMeiliIndexSettings() {
  await meiliEnsureIndex();
  const settingsTask = await meiliUpdateSettings(MEILI_SETTINGS);
  if (settingsTask?.taskUid != null) {
    await meiliWaitForTask(settingsTask.taskUid);
  }

  const synonyms = buildMeiliSynonyms();
  const synonymsTask = await meiliUpdateSynonyms(synonyms);
  if (synonymsTask?.taskUid != null) {
    await meiliWaitForTask(synonymsTask.taskUid);
  }
}

async function uploadDocuments(documents) {
  const deleteTask = await meiliDeleteAllDocuments();
  if (deleteTask?.taskUid != null) {
    await meiliWaitForTask(deleteTask.taskUid);
  }

  for (let start = 0; start < documents.length; start += BATCH_SIZE) {
    const chunk = documents.slice(start, start + BATCH_SIZE);
    const task = await meiliAddDocuments(chunk);
    if (task?.taskUid != null) {
      await meiliWaitForTask(task.taskUid);
    }
    console.log(`[search-indexer] Uploaded ${Math.min(start + chunk.length, documents.length)} / ${documents.length}`);
  }
}

async function runFullReindex(db) {
  console.log('[search-indexer] Checking Meilisearch health...');
  await meiliHealth();
  await applyMeiliIndexSettings();

  console.log('[search-indexer] Loading Mongo merchants...');
  const merchants = await loadMerchants(db);
  console.log(`[search-indexer] Loaded ${merchants.length} active merchants`);

  const dataset = buildSearchDatasetFromMerchantDocs(merchants);
  console.log(
    `[search-indexer] Built dataset: merchants=${dataset.merchantDocuments.length}, products=${dataset.productDocuments.length}, intents=${dataset.intentDocuments.length}`
  );

  await uploadDocuments(dataset.allDocuments);
  console.log('[search-indexer] Full reindex complete');
}

async function runWatchMode(db) {
  console.log('[search-indexer] Starting watch mode...');
  let scheduled = false;
  let timer = null;

  const scheduleReindex = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      if (scheduled) return;
      scheduled = true;
      try {
        await runFullReindex(db);
      } catch (error) {
        console.error('[search-indexer] Reindex during watch failed:', error);
      } finally {
        scheduled = false;
      }
    }, 15000);
  };

  const stream = db.collection(COLLECTION).watch([], {
    fullDocument: 'updateLookup',
    maxAwaitTimeMS: 1000
  });

  stream.on('change', (change) => {
    console.log(`[search-indexer] Change detected: ${change.operationType}`);
    scheduleReindex();
  });
  stream.on('error', (error) => {
    console.error('[search-indexer] Change stream error:', error);
  });

  process.on('SIGINT', async () => {
    console.log('\n[search-indexer] Closing watch stream...');
    await stream.close();
    process.exit(0);
  });

  await new Promise(() => {});
}

async function main() {
  loadEnvFile('.env');
  loadEnvFile('.env.local');

  const mongoUri = process.env.MONGODB_URI_READ_ONLY;
  if (!mongoUri) {
    throw new Error('MONGODB_URI_READ_ONLY is required');
  }

  const mode = process.argv[2] || 'full';
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);

    if (mode === 'watch') {
      await runWatchMode(db);
      return;
    }

    await runFullReindex(db);
  } finally {
    if (mode !== 'watch') {
      await client.close();
    }
  }
}

main().catch((error) => {
  console.error('[search-indexer] Fatal error:', error);
  process.exit(1);
});
