// Creates the ai-business-portal database with its core collections and
// indexes, and seeds the plans plus the demo business. Safe to re-run.
//   pnpm db:seed
import "dotenv/config";
import mongoose from "mongoose";
import { businesses as botBusinesses } from "../src/modules/bot/fixtures.js";

const uri = process.env.MONGODB_URI;
if (!uri) { console.error("MONGODB_URI is not set"); process.exit(1); }

// Every tenant collection starts its compound indexes with businessId (README §4.4).
const collections: Record<string, { keys: Record<string, 1 | -1>; options?: mongoose.mongo.CreateIndexesOptions }[]> = {
  // platform
  users: [{ keys: { supabaseId: 1 }, options: { unique: true, sparse: true } }, { keys: { email: 1 }, options: { unique: true } }],
  plans: [{ keys: { key: 1 }, options: { unique: true } }],
  subscriptions: [{ keys: { businessId: 1 } }, { keys: { status: 1, renewsAt: 1 } }],
  payments: [{ keys: { businessId: 1, at: -1 } }],
  invoices: [{ keys: { number: 1 }, options: { unique: true } }, { keys: { businessId: 1, issuedAt: -1 } }],
  support_tickets: [{ keys: { businessId: 1, status: 1 } }],
  audit_logs: [{ keys: { at: -1 } }, { keys: { targetBusinessId: 1, at: -1 } }],
  usage_records: [{ keys: { businessId: 1, date: 1 }, options: { unique: true } }],
  // per business
  businesses: [{ keys: { slug: 1 }, options: { unique: true } }, { keys: { widgetKey: 1 }, options: { unique: true } }],
  memberships: [{ keys: { businessId: 1, userId: 1 }, options: { unique: true } }, { keys: { userId: 1 } }],
  channel_integrations: [{ keys: { businessId: 1, channel: 1 }, options: { unique: true } }],
  categories: [{ keys: { businessId: 1, name: 1 } }],
  products: [{ keys: { businessId: 1, categoryId: 1 } }, { keys: { businessId: 1, name: "text" as unknown as 1 } }],
  delivery_zones: [{ keys: { businessId: 1 } }],
  faqs: [{ keys: { businessId: 1 } }],
  knowledge_documents: [{ keys: { businessId: 1 } }],
  knowledge_chunks: [{ keys: { businessId: 1, documentId: 1 } }],
  customers: [{ keys: { businessId: 1, phone: 1 }, options: { unique: true, sparse: true } }],
  conversations: [{ keys: { businessId: 1, lastMessageAt: -1 } }, { keys: { businessId: 1, status: 1 } }],
  messages: [{ keys: { businessId: 1, conversationId: 1, at: 1 } }],
  orders: [{ keys: { businessId: 1, placedAt: -1 } }, { keys: { businessId: 1, status: 1 } }],
  notifications: [{ keys: { businessId: 1, at: -1 } }],
  bot_sessions: [{ keys: { businessId: 1, sessionId: 1 }, options: { unique: true } }, { keys: { lastSeenAt: 1 }, options: { expireAfterSeconds: 60 * 60 * 24 } }],
};

const plans = [
  { key: "starter", name: "Starter", monthlyUsd: 19, aiReplies: 300, channels: 1, staffSeats: 1 },
  { key: "growth", name: "Growth", monthlyUsd: 49, aiReplies: 1000, channels: 2, staffSeats: 3 },
  { key: "pro", name: "Pro", monthlyUsd: 99, aiReplies: 3000, channels: 4, staffSeats: 10 },
  { key: "business", name: "Business", monthlyUsd: 199, aiReplies: 10000, channels: 4, staffSeats: 25 },
];

async function main() {
  await mongoose.connect(uri!);
  const db = mongoose.connection.db!;
  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
  for (const [name, indexes] of Object.entries(collections)) {
    if (!existing.has(name)) await db.createCollection(name);
    for (const ix of indexes) await db.collection(name).createIndex(ix.keys as never, ix.options);
  }
  for (const p of plans) await db.collection("plans").updateOne({ key: p.key }, { $set: { ...p, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });

  const demo = botBusinesses[0];
  const now = new Date();
  await db.collection("businesses").updateOne(
    { slug: demo.key },
    {
      $set: { name: demo.name, industry: "restaurant", country: "Pakistan", city: "Karachi", currency: "PKR", locale: demo.locale, widgetKey: demo.key, allowedOrigins: demo.allowedOrigins, branding: { brand: demo.brand, logoText: demo.logoText }, owner: { name: "Imran Siddiqui", email: demo.ownerEmail, phone: demo.ownerPhone }, plan: "growth", status: "active", greeting: demo.greeting, quickReplies: demo.quickReplies, hours: demo.hours, minOrder: demo.minOrder, updatedAt: now },
      $setOnInsert: { createdAt: now, registeredAt: now },
    },
    { upsert: true },
  );
  const biz = await db.collection("businesses").findOne({ slug: demo.key });
  const businessId = biz!._id;
  for (const z of demo.zones) await db.collection("delivery_zones").updateOne({ businessId, name: z.name }, { $set: { aliases: z.aliases, charge: z.charge, etaMins: z.etaMins, active: true } }, { upsert: true });
  for (const p of demo.products) await db.collection("products").updateOne({ businessId, name: p.name }, { $set: { aliases: p.aliases, price: p.price, available: p.available, note: p.note ?? null } }, { upsert: true });

  const summary: Record<string, number> = {};
  for (const name of Object.keys(collections)) summary[name] = await db.collection(name).countDocuments();
  console.table(summary);
  console.log(`seeded database "${db.databaseName}" at ${uri}`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
