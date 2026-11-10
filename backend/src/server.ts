import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./db/mongo.js";
import { log } from "./lib/logger.js";

const app = createApp();
connectMongo().then(() => {
  app.listen(env.port, () => log.info(`backend listening on http://localhost:${env.port}`));
});
