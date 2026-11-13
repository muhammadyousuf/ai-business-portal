import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "../config/env.js";

const ip = (req: import("express").Request) => ipKeyGenerator(req.ip ?? "");
const mk = (max: number, windowMs: number, keyGenerator?: (req: import("express").Request) => string) =>
  rateLimit({ windowMs, limit: env.isTest ? 10_000 : max, standardHeaders: true, legacyHeaders: false, keyGenerator, message: { error: "Too many requests, please try again shortly", code: "rate_limited" } });

export const authLimiter = mk(10, 60_000);
export const apiLimiter = mk(300, 60_000, (req) => req.auth?.sub ?? ip(req));
export const botLimiter = mk(60, 60_000, (req) => `${ip(req)}:${req.params.widgetKey ?? ""}`);
export const uploadLimiter = mk(30, 60_000, (req) => req.auth?.sub ?? ip(req));
