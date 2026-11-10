import { Router } from "express";
import { notImplemented } from "../../lib/http-error.js";

// Planned routes for the admin module. Each handler returns 501 with this list
// until it is implemented, so the API surface is visible from day one.
export const PLANNED = ["GET /v1/admin/overview","GET /v1/admin/businesses","POST /v1/admin/businesses/:id/suspend","POST /v1/admin/businesses/:id/reactivate","POST /v1/admin/businesses/:id/extend-trial","GET /v1/admin/plans","PUT /v1/admin/plans/:key","GET /v1/admin/payments","GET /v1/admin/invoices","POST /v1/admin/invoices (manual)","POST /v1/admin/invoices/:id/credit-note","GET /v1/admin/conversations (masked)","GET /v1/admin/orders","GET /v1/admin/ai-usage","GET /v1/admin/tickets","GET /v1/admin/audit-logs","POST /v1/admin/impersonate/:businessId (audited)"];

export const adminRouter = Router();
adminRouter.all("*", (_req, _res, next) => next(notImplemented(PLANNED)));
