import type { RequestHandler } from "express";
import { forbidden, notFound } from "../lib/http-error.js";
import { Category, Membership, Organization, type ModuleKey } from "../models/index.js";

// Resolves :orgId (the organization UUID) and pins it on the request.
export const loadOrg: RequestHandler = async (req, _res, next) => {
  try {
    const org = await Organization.findOne({ uuid: req.params.orgId, status: { $ne: "deleted" } });
    if (!org) throw notFound("Organization not found");
    req.org = org;
    req.category = (await Category.findOne({ key: org.categoryKey })) ?? undefined;
    next();
  } catch (e) { next(e); }
};

// Admin variant: deleted organizations are still visible.
export const loadOrgForAdmin: RequestHandler = async (req, _res, next) => {
  try {
    const org = await Organization.findOne({ uuid: req.params.orgId });
    if (!org) throw notFound("Organization not found");
    req.org = org;
    req.category = (await Category.findOne({ key: org.categoryKey })) ?? undefined;
    next();
  } catch (e) { next(e); }
};

export const requireMember: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.user || !req.org) throw forbidden();
    const m = await Membership.findOne({ orgId: req.org.uuid, userId: String(req.user._id), status: "active" });
    if (!m) throw forbidden("You are not a member of this organization");
    if (req.org.status === "suspended") throw forbidden("This organization is suspended. Contact support.");
    req.membership = m;
    next();
  } catch (e) { next(e); }
};

export const requireOwner: RequestHandler = (req, _res, next) => (req.membership?.role === "owner" ? next() : next(forbidden("Only the organization owner can do that")));

// Guards a module route by the organization's category configuration.
export const requireModule = (mod: ModuleKey): RequestHandler => (req, _res, next) =>
  req.category?.modules.includes(mod) ? next() : next(forbidden(`The ${mod} module is not enabled for this organization's category`));
