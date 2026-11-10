import mongoose from "mongoose";
import { env } from "../config/env.js";
import { log } from "../lib/logger.js";

// Every tenant collection carries `businessId`; repositories inject it from the
// authenticated context (see middleware/tenant.ts). Never query without it.
export async function connectMongo() {
  if (!env.mongoUri) {
    log.warn("MONGODB_URI not set, running with in-memory fixtures");
    return false;
  }
  await mongoose.connect(env.mongoUri);
  log.info("mongo connected");
  return true;
}
