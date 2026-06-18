import fs from 'node:fs';
import { MongoClient } from 'mongodb';
import { PROVIDER_STATIC_METADATA } from '../api/provider-metadata.js';

function loadEnvFile(fileName) {
  if (!fs.existsSync(fileName)) return;

  for (const line of fs.readFileSync(fileName, 'utf8').split(/\r?\n/)) {
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
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.DATABASE_NAME || 'benefitsV3';

if (!mongoUri) {
  throw new Error('MONGODB_URI is required to update providers metadata');
}

const client = new MongoClient(mongoUri);

try {
  await client.connect();
  const providers = client.db(databaseName).collection('providers');

  for (const [key, metadata] of Object.entries(PROVIDER_STATIC_METADATA)) {
    const result = await providers.updateOne(
      { key },
      {
        $addToSet: {
          aliases: { $each: metadata.aliases || [] }
        },
        $set: {
          shortName: metadata.shortName,
          updatedAt: new Date().toISOString()
        }
      }
    );

    console.log(`[providers] ${key}: matched=${result.matchedCount} modified=${result.modifiedCount}`);
  }
} finally {
  await client.close();
}
