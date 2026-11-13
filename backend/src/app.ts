import express from "express";
import helmet from "helmet";
import path from "node:path";
import { env } from "./config/env.js";
import { requestId } from "./middleware/request-id.js";
import { portalCors } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error.js";
import { requireAdmin, requireJwt, requireUser } from "./middleware/auth.js";
import { loadOrg, requireMember } from "./middleware/org.js";
import { apiLimiter } from "./middleware/rate-limit.js";
import { authRouter } from "./modules/auth/router.js";
import { meRouter } from "./modules/me/router.js";
import { invitationsRouter } from "./modules/invitations/router.js";
import { orgRouter } from "./modules/orgs/index.js";
import { botRouter } from "./modules/bot/router.js";
import { adminRouter } from "./modules/admin/router.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(requestId);
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true, service: "assistflow-backend", env: env.nodeEnv, time: new Date().toISOString() }));
  app.use("/uploads", express.static(path.join(process.cwd(), env.uploadDir), { maxAge: "7d", index: false }));

  // Public widget API: per-organization CORS inside the router.
  app.use("/v1/bot", botRouter);

  // Portal APIs
  app.use("/v1", portalCors);
  app.use("/v1/auth", authRouter);
  app.use("/v1/invitations", invitationsRouter);
  app.use("/v1/me", requireJwt, apiLimiter, requireUser, meRouter);
  app.use("/v1/orgs/:orgId", requireJwt, apiLimiter, requireUser, loadOrg, requireMember, orgRouter);
  app.use("/v1/admin", requireJwt, apiLimiter, requireAdmin, adminRouter);

  app.use((_req, res) => res.status(404).json({ error: "Not found", code: "not_found" }));
  app.use(errorHandler);
  return app;
}
