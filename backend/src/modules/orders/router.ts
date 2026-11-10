import { Router } from "express";
import { notImplemented } from "../../lib/http-error.js";

// Planned routes for the orders module. Each handler returns 501 with this list
// until it is implemented, so the API surface is visible from day one.
export const PLANNED = ["GET /v1/orders?status=","GET /v1/orders/:id","POST /v1/orders (manual)","POST /v1/orders/:id/confirm (notifies customer)","POST /v1/orders/:id/reject","POST /v1/orders/:id/status","GET /v1/orders/export.csv"];

export const ordersRouter = Router();
ordersRouter.all("*", (_req, _res, next) => next(notImplemented(PLANNED)));
