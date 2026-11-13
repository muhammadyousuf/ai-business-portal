import mongoose from "mongoose";
import { env } from "../config/env.js";
import { log } from "../lib/logger.js";

export async function connectMongo(uri = env.mongoUri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  log.info("mongo connected", { db: mongoose.connection.db?.databaseName });
}
export async function disconnectMongo() { await mongoose.disconnect(); }
