import cors from "cors";
import { env } from "../config/env.js";
import { Organization } from "../models/index.js";

export const portalCors = cors({ origin: env.portalOrigins.length ? env.portalOrigins : true, credentials: true, exposedHeaders: ["x-request-id"] });

// Widget requests: allowed only from the organization's registered website origins (plus dev origins).
export const botCors = cors(async (req, cb) => {
  const r = req as unknown as import("express").Request;
  const key = r.params?.widgetKey ?? r.path.split("/")[3];
  const org = await Organization.findOne({ widgetKey: key }, { allowedOrigins: 1 }).lean();
  const allowed = new Set([...env.botDevOrigins, ...(org?.allowedOrigins ?? [])]);
  cb(null, { origin: (origin, done) => done(null, !origin || allowed.size === env.botDevOrigins.length && org?.allowedOrigins?.length === 0 ? true : allowed.has(origin ?? "")), methods: ["GET", "POST"], allowedHeaders: ["Content-Type", "Authorization"] });
});
