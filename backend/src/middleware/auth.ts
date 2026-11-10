import type { RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";

// Portal auth. Will validate an Auth.js session / JWT and attach the user.
// Roles: super_admin | support | finance (platform), owner | manager | agent (business).
export type AuthUser = { id: string; role: string; businessId?: string };
// Request augmentation lives in src/types/express.d.ts

export const requireUser: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  if (!header) return next(new HttpError(401, "Sign in required"));
  // TODO: verify token. Dev shortcut: "Bearer dev:<role>:<businessId?>"
  const [, payload] = header.split(" ");
  const [scheme, role, businessId] = (payload ?? "").split(":");
  if (scheme !== "dev") return next(new HttpError(401, "Invalid token"));
  req.user = { id: "dev", role, businessId: businessId || undefined };
  next();
};

export const requireRole = (...roles: string[]): RequestHandler => (req, _res, next) =>
  req.user && roles.includes(req.user.role) ? next() : next(new HttpError(403, "Forbidden"));
