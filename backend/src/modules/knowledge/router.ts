import { Router } from "express";
import { notImplemented } from "../../lib/http-error.js";

// Planned routes for the knowledge module. Each handler returns 501 with this list
// until it is implemented, so the API surface is visible from day one.
export const PLANNED = ["GET /v1/knowledge/faqs","POST /v1/knowledge/faqs","PATCH /v1/knowledge/faqs/:id","POST /v1/knowledge/documents (upload -> R2, chunk, embed)","GET /v1/knowledge/documents","DELETE /v1/knowledge/documents/:id","GET /v1/knowledge/gaps (unanswered questions)"];

export const knowledgeRouter = Router();
knowledgeRouter.all("*", (_req, _res, next) => next(notImplemented(PLANNED)));
