import { Router } from "express";
import { notImplemented } from "../../lib/http-error.js";

// Planned routes for the channels module. Each handler returns 501 with this list
// until it is implemented, so the API surface is visible from day one.
export const PLANNED = ["GET /v1/channels","POST /v1/channels/website (verify origin)","POST /v1/channels/whatsapp/connect","GET /webhooks/whatsapp (verify)","POST /webhooks/whatsapp (inbound)","GET /webhooks/meta (verify)","POST /webhooks/meta (messenger + instagram inbound)"];

export const channelsRouter = Router();
channelsRouter.all("*", (_req, _res, next) => next(notImplemented(PLANNED)));
