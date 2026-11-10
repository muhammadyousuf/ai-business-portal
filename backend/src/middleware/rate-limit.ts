import type { RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";

// Minimal in-memory limiter for the public bot endpoints. Replace with Redis
// (or the hosting platform's limiter) before real traffic.
const buckets = new Map<string, { count: number; reset: number }>();
export const rateLimit = (max: number, windowMs: number): RequestHandler => (req, _res, next) => {
  const key = `${req.ip}:${req.params.businessKey ?? ""}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { count: 1, reset: now + windowMs }); return next(); }
  if (++b.count > max) return next(new HttpError(429, "Too many requests"));
  next();
};
