// Template from the agregar-banco skill. Copy to scripts/seed<Banco>References.ts in
// benefits-backend-v2, fill in the constants below (decided with the user in phase 2),
// and add "seed-<banco>-references": "tsx scripts/seed<Banco>References.ts" to package.json.
import { config } from "dotenv";
import { MongoClient } from "mongodb";

config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DATABASE_NAME = process.env.DATABASE_NAME || "benefits_db";

// Lowercase prefix of the raw collection: PATAGONIA_PROMOS_RAW -> "patagonia".
const BANK = "<banco>";
const PROVIDER_NAME = "<Nombre del banco>";
// Card tiers (segments, if they were modelled as tiers); "any" covers benefits that name
// no tier. Patagonia: ["clasica", "plus", "singular", "on", "any"].
const TIERS = ["any"];
const CARD_PRODUCTS = [
  { issuer: "visa", type: "credito" },
  { issuer: "visa", type: "debito" },
  { issuer: "mastercard", type: "credito" },
  { issuer: "amex", type: "credito" },
];
// Patagonia: ["plan sueldo y jubilación"]. Empty when the bank has no subscription.
const SUBSCRIPTIONS: string[] = [];

// Reference rows the normalizer resolves the bank's benefits against. Values are lowercase,
// as bankingService stores them.
export function buildReferences() {
  return {
    provider: { key: BANK, name: PROVIDER_NAME },
    cards: TIERS.flatMap((tier) => CARD_PRODUCTS.map(({ issuer, type }) => ({ bank: BANK, issuer, tier, type }))),
    subscriptions: SUBSCRIPTIONS.map((name) => ({ bank: BANK, name })),
  };
}

// Dry run by default; pass --apply to write. Existing rows are left untouched, so the
// script can be re-run safely.
async function main() {
  const apply = process.argv.includes("--apply");
  const { provider, cards, subscriptions } = buildReferences();
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(DATABASE_NAME);
    const plan = [
      { collection: "providers", filter: { key: provider.key }, doc: provider },
      ...cards.map((card) => ({ collection: "bank_cards", filter: card, doc: card })),
      ...subscriptions.map((sub) => ({ collection: "bank_subscriptions", filter: sub, doc: sub })),
    ];
    let missing = 0;
    for (const { collection, filter, doc } of plan) {
      const exists = await db.collection(collection).findOne(filter, { projection: { _id: 1 } });
      if (exists) {
        console.log(`exists   ${collection} ${JSON.stringify(filter)}`);
        continue;
      }
      missing += 1;
      if (apply) {
        await db.collection(collection).updateOne(filter, { $setOnInsert: doc }, { upsert: true });
        console.log(`inserted ${collection} ${JSON.stringify(doc)}`);
      } else {
        console.log(`missing  ${collection} ${JSON.stringify(doc)}`);
      }
    }
    console.log(`${DATABASE_NAME}: ${plan.length} rows, ${missing} ${apply ? "inserted" : "missing (dry run; pass --apply to insert)"}`);
  } finally {
    await client.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
