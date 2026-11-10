import { Router } from "express";
import { notImplemented } from "../../lib/http-error.js";

// Planned routes for the billing module. Each handler returns 501 with this list
// until it is implemented, so the API surface is visible from day one.
export const PLANNED = ["GET /v1/billing/subscription","GET /v1/billing/invoices","POST /v1/billing/change-plan","POST /v1/billing/webhooks/stripe","GET /v1/billing/usage"];

export const billingRouter = Router();
billingRouter.all("*", (_req, _res, next) => next(notImplemented(PLANNED)));
