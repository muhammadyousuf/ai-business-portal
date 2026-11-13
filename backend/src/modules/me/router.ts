import { Router } from "express";
import { z } from "zod";
import { wrap } from "../../lib/async.js";
import { validate } from "../../lib/validate.js";
import { pageQuery, paged, skip } from "../../lib/pagination.js";
import { toJSONList } from "../../lib/serialize.js";
import { imageUpload } from "../../middleware/upload.js";
import { uploadLimiter } from "../../middleware/rate-limit.js";
import { Category, Membership, NOTIFICATION_PREF_KEYS, Notification, Organization } from "../../models/index.js";
import { saveUpload } from "../../services/files.js";
import { setPassword, verifyPassword } from "../../services/supabase-admin.js";
import { publicOrg } from "../../services/orgs.js";

// Everything under /v1/me assumes requireJwt + requireUser ran.
export const meRouter = Router();

meRouter.get("/", wrap(async (req, res) => { req.user!.lastLoginAt = new Date(); await req.user!.save(); res.json({ user: req.user!.toJSON() }); }));

meRouter.patch("/", validate({ body: z.object({ name: z.string().trim().min(1).max(80).optional(), phone: z.string().trim().max(32).optional() }) }), wrap(async (req, res) => {
  Object.assign(req.user!, req.body); await req.user!.save(); res.json({ user: req.user!.toJSON() });
}));

meRouter.post("/avatar", uploadLimiter, imageUpload, wrap(async (req, res) => {
  const f = await saveUpload({ file: req.file, kind: "image", purpose: "avatar", uploaderType: "user", uploaderId: String(req.user!._id) });
  req.user!.avatarUrl = f.url; await req.user!.save();
  res.json({ user: req.user!.toJSON(), file: f.toJSON() });
}));

const prefsSchema = z.object(Object.fromEntries(NOTIFICATION_PREF_KEYS.map((k) => [k, z.boolean().optional()])) as Record<(typeof NOTIFICATION_PREF_KEYS)[number], z.ZodOptional<z.ZodBoolean>>);
meRouter.patch("/notification-preferences", validate({ body: prefsSchema }), wrap(async (req, res) => {
  req.user!.set("notificationPrefs", { ...(req.user!.toObject().notificationPrefs as object), ...req.body }); await req.user!.save();
  res.json({ notificationPrefs: req.user!.notificationPrefs });
}));

meRouter.post("/change-password", validate({ body: z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/[0-9]/) }) }), wrap(async (req, res) => {
  await verifyPassword(req.user!.email, req.body.currentPassword);
  await setPassword(req.auth!.sub, req.body.newPassword);
  res.json({ ok: true });
}));

meRouter.get("/organizations", wrap(async (req, res) => {
  const ms = await Membership.find({ userId: String(req.user!._id), status: "active" }).lean();
  const orgs = await Organization.find({ uuid: { $in: ms.map((m) => m.orgId) }, status: { $ne: "deleted" } });
  const cats = await Category.find({ key: { $in: orgs.map((o) => o.categoryKey) } }).lean();
  res.json({ items: orgs.map((o) => ({ ...publicOrg(o), role: ms.find((m) => m.orgId === o.uuid)?.role, category: cats.find((c) => c.key === o.categoryKey) ? { key: o.categoryKey, name: cats.find((c) => c.key === o.categoryKey)!.name, modules: cats.find((c) => c.key === o.categoryKey)!.modules, labels: cats.find((c) => c.key === o.categoryKey)!.labels } : null })) });
}));

meRouter.get("/notifications", validate({ query: pageQuery.extend({ unread: z.coerce.boolean().optional() }) }), wrap(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof pageQuery> & { unread?: boolean };
  const filter = { recipientType: "user", recipientId: String(req.user!._id), ...(q.unread ? { readAt: null } : {}) };
  const [items, total, unread] = await Promise.all([Notification.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.limit).lean(), Notification.countDocuments(filter), Notification.countDocuments({ recipientType: "user", recipientId: String(req.user!._id), readAt: null })]);
  res.json({ ...paged(toJSONList(items), total, q), unread });
}));
meRouter.patch("/notifications/:id/read", wrap(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, recipientId: String(req.user!._id) }, { $set: { readAt: new Date() } }); res.json({ ok: true });
}));
meRouter.post("/notifications/read-all", wrap(async (req, res) => {
  await Notification.updateMany({ recipientType: "user", recipientId: String(req.user!._id), readAt: null }, { $set: { readAt: new Date() } }); res.json({ ok: true });
}));
