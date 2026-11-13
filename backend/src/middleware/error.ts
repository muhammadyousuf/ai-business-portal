import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error.js";
import { log } from "../lib/logger.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) return res.status(400).json({ error: "Validation failed", code: "validation", details: err.flatten().fieldErrors });
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code, ...(err.details ? { details: err.details } : {}) });
  if ((err as { type?: string }).type === "entity.too.large") return res.status(413).json({ error: "Payload too large", code: "too_large" });
  if ((err as { code?: string }).code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File too large", code: "too_large" });
  if ((err as { code?: number }).code === 11000) return res.status(409).json({ error: "Already exists", code: "conflict" });
  log.error("unhandled", { requestId: req.requestId, message: (err as Error).message, stack: (err as Error).stack });
  return res.status(500).json({ error: "Internal error", code: "internal", requestId: req.requestId });
};
