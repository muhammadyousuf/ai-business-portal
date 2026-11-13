import { Router } from "express";
import { z } from "zod";
import { wrap } from "../../lib/async.js";
import { badRequest, notFound } from "../../lib/http-error.js";
import { toJSONList } from "../../lib/serialize.js";
import { validate } from "../../lib/validate.js";
import { imageUpload } from "../../middleware/upload.js";
import { uploadLimiter } from "../../middleware/rate-limit.js";
import { Branch, CatalogGroup, CatalogItem } from "../../models/index.js";
import { logActivity, userActor } from "../../services/activity.js";
import { saveUpload } from "../../services/files.js";

export const catalogRouter = Router({ mergeParams: true });
const groupBody = z.object({ name: z.string().trim().min(1).max(120), description: z.string().max(1000).optional(), branchId: z.string().optional().or(z.literal("")), sortOrder: z.number().int().optional(), isActive: z.boolean().optional() });
const itemBody = z.object({
  groupId: z.string().min(1), name: z.string().trim().min(1).max(160), description: z.string().max(2000).optional(), price: z.number().min(0), currency: z.string().max(8).optional(), branchId: z.string().optional().or(z.literal("")),
  tags: z.array(z.string().max(40)).max(20).optional(), options: z.array(z.object({ name: z.string().max(60), choices: z.array(z.object({ label: z.string().max(60), delta: z.number().default(0) })).max(20) })).max(10).optional(),
  isAvailable: z.boolean().optional(), sortOrder: z.number().int().optional(), durationMinutes: z.number().int().min(0).optional(), imageUrl: z.string().max(500).optional(), files: z.array(z.string().max(500)).max(10).optional(),
});

async function assertBranch(orgId: string, branchId?: string) { if (branchId && !(await Branch.exists({ _id: branchId, orgId }))) throw badRequest("Unknown branch"); }

catalogRouter.get("/groups", wrap(async (req, res) => res.json({ items: toJSONList(await CatalogGroup.find({ orgId: req.org!.uuid }).sort({ sortOrder: 1, createdAt: 1 }).lean()) })));
catalogRouter.post("/groups", validate({ body: groupBody }), wrap(async (req, res) => {
  await assertBranch(req.org!.uuid, req.body.branchId);
  const g = await CatalogGroup.create({ ...req.body, orgId: req.org!.uuid });
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "catalog.group_created", targetType: "catalog_group", targetId: String(g._id), summary: `${req.user!.name || req.user!.email} added ${req.category?.labels?.catalogGroup?.toLowerCase() ?? "group"} ${g.name}` });
  res.status(201).json({ group: g.toJSON() });
}));
catalogRouter.patch("/groups/:id", validate({ body: groupBody.partial() }), wrap(async (req, res) => {
  const g = await CatalogGroup.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!g) throw notFound("Group not found");
  await assertBranch(req.org!.uuid, req.body.branchId); Object.assign(g, req.body); await g.save(); res.json({ group: g.toJSON() });
}));
catalogRouter.delete("/groups/:id", wrap(async (req, res) => {
  const g = await CatalogGroup.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!g) throw notFound("Group not found");
  const n = await CatalogItem.countDocuments({ orgId: req.org!.uuid, groupId: String(g._id) });
  if (n) throw badRequest(`Move or delete the ${n} item(s) in this group first`);
  await g.deleteOne(); res.json({ ok: true });
}));

catalogRouter.get("/items", validate({ query: z.object({ groupId: z.string().optional(), q: z.string().max(100).optional() }) }), wrap(async (req, res) => {
  const { groupId, q } = req.query as { groupId?: string; q?: string };
  const filter: Record<string, unknown> = { orgId: req.org!.uuid, ...(groupId ? { groupId } : {}), ...(q ? { name: { $regex: q, $options: "i" } } : {}) };
  res.json({ items: toJSONList(await CatalogItem.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean()) });
}));
catalogRouter.post("/items", validate({ body: itemBody }), wrap(async (req, res) => {
  if (!(await CatalogGroup.exists({ _id: req.body.groupId, orgId: req.org!.uuid }))) throw badRequest("Unknown group");
  await assertBranch(req.org!.uuid, req.body.branchId);
  const it = await CatalogItem.create({ ...req.body, orgId: req.org!.uuid, currency: req.body.currency ?? req.org!.currency });
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "catalog.item_created", targetType: "catalog_item", targetId: String(it._id), summary: `${req.user!.name || req.user!.email} added ${it.name} (${it.currency} ${it.price})` });
  res.status(201).json({ item: it.toJSON() });
}));
catalogRouter.get("/items/:id", wrap(async (req, res) => { const it = await CatalogItem.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!it) throw notFound("Item not found"); res.json({ item: it.toJSON() }); }));
catalogRouter.patch("/items/:id", validate({ body: itemBody.partial() }), wrap(async (req, res) => {
  const it = await CatalogItem.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!it) throw notFound("Item not found");
  if (req.body.groupId && !(await CatalogGroup.exists({ _id: req.body.groupId, orgId: req.org!.uuid }))) throw badRequest("Unknown group");
  await assertBranch(req.org!.uuid, req.body.branchId);
  Object.assign(it, req.body); await it.save();
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "catalog.item_updated", targetType: "catalog_item", targetId: String(it._id), summary: `${req.user!.name || req.user!.email} updated ${it.name}` });
  res.json({ item: it.toJSON() });
}));
catalogRouter.delete("/items/:id", wrap(async (req, res) => {
  const it = await CatalogItem.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!it) throw notFound("Item not found");
  await it.deleteOne();
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "catalog.item_deleted", targetType: "catalog_item", targetId: String(it._id), summary: `${req.user!.name || req.user!.email} deleted ${it.name}` });
  res.json({ ok: true });
}));
catalogRouter.post("/items/:id/image", uploadLimiter, imageUpload, wrap(async (req, res) => {
  const it = await CatalogItem.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!it) throw notFound("Item not found");
  const f = await saveUpload({ file: req.file, kind: "image", purpose: "catalog", orgId: req.org!.uuid, uploaderType: "user", uploaderId: String(req.user!._id) });
  it.imageUrl = f.url; await it.save(); res.json({ item: it.toJSON(), file: f.toJSON() });
}));
