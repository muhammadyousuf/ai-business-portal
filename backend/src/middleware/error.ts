import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error.js";
import { log } from "../lib/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
  log.error("unhandled", { message: (err as Error).message });
  return res.status(500).json({ error: "Internal error" });
};
