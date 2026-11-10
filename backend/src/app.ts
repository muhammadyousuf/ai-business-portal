import express from "express";
import { portalCors } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error.js";
import { requireUser, requireRole } from "./middleware/auth.js";
import { resolveTenant } from "./middleware/tenant.js";
import { healthRouter } from "./modules/health/router.js";
import { botRouter } from "./modules/bot/router.js";
import { authRouter } from "./modules/auth/router.js";
import { businessesRouter } from "./modules/businesses/router.js";
import { catalogRouter } from "./modules/catalog/router.js";
import { knowledgeRouter } from "./modules/knowledge/router.js";
import { conversationsRouter } from "./modules/conversations/router.js";
import { ordersRouter } from "./modules/orders/router.js";
import { customersRouter } from "./modules/customers/router.js";
import { billingRouter } from "./modules/billing/router.js";
import { adminRouter } from "./modules/admin/router.js";
import { channelsRouter } from "./modules/channels/router.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);

  // Public widget API (CORS per business, rate limited, session token)
  app.use("/v1/bot", botRouter);

  // Channel webhooks (verified by provider signature, no CORS needed)
  app.use("/webhooks", channelsRouter);

  // Portal APIs (admin + user apps)
  app.use("/v1", portalCors);
  app.use("/v1/auth", authRouter);
  app.use("/v1/admin", requireUser, requireRole("super_admin", "support", "finance"), adminRouter);
  app.use("/v1/businesses", requireUser, businessesRouter);
  for (const [path, router] of [
    ["/v1/catalog", catalogRouter], ["/v1/knowledge", knowledgeRouter], ["/v1/conversations", conversationsRouter],
    ["/v1/orders", ordersRouter], ["/v1/customers", customersRouter], ["/v1/billing", billingRouter], ["/v1/channels", channelsRouter],
  ] as const) {
    app.use(path, requireUser, resolveTenant, router);
  }

  app.use((_req, res) => res.status(404).json({ error: "Not found" }));
  app.use(errorHandler);
  return app;
}
