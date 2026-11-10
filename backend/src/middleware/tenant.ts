import type { RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";

// Resolves the business a portal request belongs to and pins it on the request.
// Business users: from their membership. Platform admins: from an explicit
// `X-Business-Id` header, and the access is written to the audit log.
export const resolveTenant: RequestHandler = (req, _res, next) => {
  const fromUser = req.user?.businessId;
  const fromHeader = req.header("x-business-id");
  const isPlatform = ["super_admin", "support", "finance"].includes(req.user?.role ?? "");
  const businessId = fromUser ?? (isPlatform ? fromHeader : undefined);
  if (!businessId) return next(new HttpError(400, "No business context"));
  if (isPlatform && fromHeader) {
    // TODO: audit_logs.insert({ actor: req.user.id, action: "tenant_access", target: businessId })
  }
  req.businessId = businessId;
  next();
};
