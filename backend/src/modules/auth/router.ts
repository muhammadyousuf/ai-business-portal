import { Router } from "express";
import { notImplemented } from "../../lib/http-error.js";

// Planned routes for the auth module. Each handler returns 501 with this list
// until it is implemented, so the API surface is visible from day one.
export const PLANNED = ["POST /v1/auth/magic-link","POST /v1/auth/callback","GET /v1/auth/me","POST /v1/auth/sign-out"];

export const authRouter = Router();
authRouter.all("*", (_req, _res, next) => next(notImplemented(PLANNED)));
