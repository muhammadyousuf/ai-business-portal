import { Router } from "express";
import { notImplemented } from "../../lib/http-error.js";

// Planned routes for the businesses module. Each handler returns 501 with this list
// until it is implemented, so the API surface is visible from day one.
export const PLANNED = ["POST /v1/businesses (register + 14-day trial)","GET /v1/businesses/:id","PATCH /v1/businesses/:id","GET /v1/businesses/:id/members","POST /v1/businesses/:id/members (invite)","POST /v1/businesses/:id/widget-keys (rotate public key)"];

export const businessesRouter = Router();
businessesRouter.all("*", (_req, _res, next) => next(notImplemented(PLANNED)));
