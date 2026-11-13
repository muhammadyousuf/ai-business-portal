// Idempotent seed: categories, indexes, and the first admin account.
//   pnpm db:seed                      categories + admin
//   ADMIN_EMAIL=.. ADMIN_PASSWORD=.. pnpm db:seed   override the admin account
import "dotenv/config";
import mongoose from "mongoose";
import { connectMongo, disconnectMongo } from "../src/db/mongo.js";
import { AdminUser } from "../src/models/index.js";
import { CATEGORIES, seedCategories } from "../src/seed/categories.js";
import { createAuthUser, findAuthUserByEmail, setPassword } from "../src/services/supabase-admin.js";

async function main() {
  await connectMongo();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  await seedCategories();
  console.log(`categories: ${CATEGORIES.map((c) => c.key).join(", ")}`);

  const email = (process.env.ADMIN_EMAIL ?? "muhammadyousuf327@gmail.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Hello123@";
  let authUser = await findAuthUserByEmail(email);
  if (!authUser) { authUser = await createAuthUser(email, password, { name: "Platform Admin", admin: true }); console.log(`created Supabase auth user for ${email}`); }
  else if (process.env.ADMIN_PASSWORD) { await setPassword(authUser.id, password); console.log("admin password updated"); }
  await AdminUser.updateOne({ email }, { $set: { supabaseId: authUser.id, email }, $setOnInsert: { name: "Muhammad Yousuf", isSuperAdmin: true } }, { upsert: true });
  console.log(`admin account ready: ${email}`);
  await disconnectMongo();
}
main().catch((e) => { console.error(e); process.exit(1); });
