import { Router } from "express";
import { notImplemented } from "../../lib/http-error.js";

// Planned routes for the conversations module. Each handler returns 501 with this list
// until it is implemented, so the API surface is visible from day one.
export const PLANNED = ["GET /v1/conversations?status=&channel=","GET /v1/conversations/:id","POST /v1/conversations/:id/messages (staff reply)","POST /v1/conversations/:id/takeover","POST /v1/conversations/:id/handback","POST /v1/conversations/:id/resolve","POST /v1/conversations/:id/report (wrong answer)"];

export const conversationsRouter = Router();
conversationsRouter.all("*", (_req, _res, next) => next(notImplemented(PLANNED)));
