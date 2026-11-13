import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./db/mongo.js";
import { log } from "./lib/logger.js";

connectMongo().then(() => {
  createApp().listen(env.port, () => log.info(`backend listening on http://localhost:${env.port}`));
}).catch((e) => { log.error("failed to start", { message: (e as Error).message }); process.exit(1); });
