import { Router } from "express";
import { z } from "zod";
import { wrap } from "../../lib/async.js";
import { badRequest, notFound } from "../../lib/http-error.js";
import { toJSONList } from "../../lib/serialize.js";
import { validate } from "../../lib/validate.js";
import { Branch } from "../../models/index.js";
import { logActivity, userActor } from "../../services/activity.js";

export const branchesRouter = Router({ mergeParams: true });
const hours = z.array(z.object({ day: z.number().int().min(0).max(6), open: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"), close: z.string().regex(/^\d{2}:\d{2}$/).default("18:00"), closed: z.boolean().default(false) })).max(7);
const body = z.object({
  name: z.string().trim().min(1).max(120), address: z.object({ line1: z.string().max(200).optional(), line2: z.string().max(200).optional(), city: z.string().max(80).optional(), state: z.string().max(80).optional(), country: z.string().max(80).optional(), postalCode: z.string().max(20).optional() }).optional(),
  phone: z.string().max(32).optional(), email: z.string().email().max(254).optional().or(z.literal("")), hours: hours.optional(), lat: z.number().optional(), lng: z.number().optional(), isMain: z.boolean().optional(), isActive: z.boolean().optional(),
  deliveryAreas: z.array(z.string().max(80)).max(50).optional(), deliveryCharge: z.number().min(0).optional(),
});

branchesRouter.get("/", wrap(async (req, res) => res.json({ items: toJSONList(await Branch.find({ orgId: req.org!.uuid }).sort({ isMain: -1, createdAt: 1 }).lean()) })));

branchesRouter.post("/", validate({ body }), wrap(async (req, res) => {
  if (req.body.isMain) await Branch.updateMany({ orgId: req.org!.uuid }, { $set: { isMain: false } });
  const b = await Branch.create({ ...req.body, orgId: req.org!.uuid });
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "branch.created", targetType: "branch", targetId: String(b._id), summary: `${req.user!.name || req.user!.email} added branch ${b.name}` });
  res.status(201).json({ branch: b.toJSON() });
}));

branchesRouter.get("/:id", wrap(async (req, res) => { const b = await Branch.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!b) throw notFound("Branch not found"); res.json({ branch: b.toJSON() }); }));

branchesRouter.patch("/:id", validate({ body: body.partial() }), wrap(async (req, res) => {
  const b = await Branch.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!b) throw notFound("Branch not found");
  if (req.body.isMain) await Branch.updateMany({ orgId: req.org!.uuid, _id: { $ne: b._id } }, { $set: { isMain: false } });
  if (req.body.address) { b.address = { ...(b.address as object), ...req.body.address } as typeof b.address; delete req.body.address; }
  Object.assign(b, req.body); await b.save();
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "branch.updated", targetType: "branch", targetId: String(b._id), summary: `${req.user!.name || req.user!.email} updated branch ${b.name}` });
  res.json({ branch: b.toJSON() });
}));

branchesRouter.delete("/:id", wrap(async (req, res) => {
  const b = await Branch.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!b) throw notFound("Branch not found");
  if (b.isMain && (await Branch.countDocuments({ orgId: req.org!.uuid })) > 1) throw badRequest("Make another branch the main branch before deleting this one");
  await b.deleteOne();
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "branch.deleted", targetType: "branch", targetId: String(b._id), summary: `${req.user!.name || req.user!.email} deleted branch ${b.name}` });
  res.json({ ok: true });
}));
