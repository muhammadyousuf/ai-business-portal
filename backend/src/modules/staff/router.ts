import { Router } from "express";
import { z } from "zod";
import { wrap } from "../../lib/async.js";
import { badRequest, notFound } from "../../lib/http-error.js";
import { toJSONList } from "../../lib/serialize.js";
import { validate } from "../../lib/validate.js";
import { imageUpload } from "../../middleware/upload.js";
import { uploadLimiter } from "../../middleware/rate-limit.js";
import { Branch, StaffProfile } from "../../models/index.js";
import { logActivity, userActor } from "../../services/activity.js";
import { saveUpload } from "../../services/files.js";

export const staffRouter = Router({ mergeParams: true });
const body = z.object({
  name: z.string().trim().min(1).max(120), title: z.string().max(120).optional(), specialty: z.string().max(120).optional(), bio: z.string().max(2000).optional(), branchId: z.string().optional().or(z.literal("")),
  fee: z.number().min(0).optional(), email: z.string().email().max(254).optional().or(z.literal("")), phone: z.string().max(32).optional(),
  availability: z.array(z.object({ day: z.number().int().min(0).max(6), start: z.string().regex(/^\d{2}:\d{2}$/), end: z.string().regex(/^\d{2}:\d{2}$/) })).max(21).optional(), slotMinutes: z.number().int().min(5).max(240).optional(), isActive: z.boolean().optional(), photoUrl: z.string().max(500).optional(),
});

staffRouter.get("/", wrap(async (req, res) => res.json({ items: toJSONList(await StaffProfile.find({ orgId: req.org!.uuid }).sort({ createdAt: 1 }).lean()) })));
staffRouter.post("/", validate({ body }), wrap(async (req, res) => {
  if (req.body.branchId && !(await Branch.exists({ _id: req.body.branchId, orgId: req.org!.uuid }))) throw badRequest("Unknown branch");
  const s = await StaffProfile.create({ ...req.body, orgId: req.org!.uuid });
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "staff.created", targetType: "staff", targetId: String(s._id), summary: `${req.user!.name || req.user!.email} added ${req.category?.labels?.staff?.toLowerCase() ?? "staff"} ${s.name}` });
  res.status(201).json({ staff: s.toJSON() });
}));
staffRouter.get("/:id", wrap(async (req, res) => { const s = await StaffProfile.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!s) throw notFound("Not found"); res.json({ staff: s.toJSON() }); }));
staffRouter.patch("/:id", validate({ body: body.partial() }), wrap(async (req, res) => {
  const s = await StaffProfile.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!s) throw notFound("Not found");
  if (req.body.branchId && !(await Branch.exists({ _id: req.body.branchId, orgId: req.org!.uuid }))) throw badRequest("Unknown branch");
  Object.assign(s, req.body); await s.save(); res.json({ staff: s.toJSON() });
}));
staffRouter.delete("/:id", wrap(async (req, res) => {
  const s = await StaffProfile.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!s) throw notFound("Not found");
  await s.deleteOne();
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "staff.deleted", targetType: "staff", targetId: String(s._id), summary: `${req.user!.name || req.user!.email} removed ${s.name}` });
  res.json({ ok: true });
}));
staffRouter.post("/:id/photo", uploadLimiter, imageUpload, wrap(async (req, res) => {
  const s = await StaffProfile.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!s) throw notFound("Not found");
  const f = await saveUpload({ file: req.file, kind: "image", purpose: "staff", orgId: req.org!.uuid, uploaderType: "user", uploaderId: String(req.user!._id) });
  s.photoUrl = f.url; await s.save(); res.json({ staff: s.toJSON(), file: f.toJSON() });
}));
