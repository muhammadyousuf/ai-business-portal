import { Router } from "express";
import { notImplemented } from "../../lib/http-error.js";

// Planned routes for the catalog module. Each handler returns 501 with this list
// until it is implemented, so the API surface is visible from day one.
export const PLANNED = ["GET /v1/catalog/categories","GET /v1/catalog/products","POST /v1/catalog/products","PATCH /v1/catalog/products/:id","POST /v1/catalog/import (CSV)","GET /v1/catalog/delivery-zones","PUT /v1/catalog/delivery-zones","PUT /v1/catalog/hours"];

export const catalogRouter = Router();
catalogRouter.all("*", (_req, _res, next) => next(notImplemented(PLANNED)));
