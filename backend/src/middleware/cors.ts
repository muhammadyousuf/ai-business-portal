import cors from "cors";
import { env } from "../config/env.js";
import { findBusinessByKey } from "../modules/bot/fixtures.js";

// Portal APIs: fixed allowlist. Bot APIs: the business's registered website
// origins (so a widget key cannot be reused from another site) plus dev origins.
export const portalCors = cors({ origin: env.portalOrigins, credentials: true });

export const botCors = cors((req, cb) => {
  const r = req as unknown as import("express").Request;
  const key = r.params?.businessKey ?? r.path.split("/")[3];
  const business = findBusinessByKey(key);
  const allowed = [...env.botDevOrigins, ...(business?.allowedOrigins ?? [])];
  cb(null, { origin: (origin, done) => done(null, !origin || allowed.includes(origin)), methods: ["GET", "POST"], allowedHeaders: ["Content-Type", "Authorization"] });
});
