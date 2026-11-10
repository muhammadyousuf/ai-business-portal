import { Router } from "express";
import { notImplemented } from "../../lib/http-error.js";

// Planned routes for the customers module. Each handler returns 501 with this list
// until it is implemented, so the API surface is visible from day one.
export const PLANNED = ["GET /v1/customers","GET /v1/customers/:id","PATCH /v1/customers/:id (tags, notes)","GET /v1/customers/:id/insight"];

export const customersRouter = Router();
customersRouter.all("*", (_req, _res, next) => next(notImplemented(PLANNED)));
