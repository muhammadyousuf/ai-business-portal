import { Router } from "express";
import { z } from "zod";
import { wrap } from "../../lib/async.js";
import { badRequest, conflict, notFound } from "../../lib/http-error.js";
import { pageQuery, paged, skip } from "../../lib/pagination.js";
import { toJSONList } from "../../lib/serialize.js";
import { validate } from "../../lib/validate.js";
import { imageUpload } from "../../middleware/upload.js";
import { loadOrgForAdmin } from "../../middleware/org.js";
import { uploadLimiter } from "../../middleware/rate-limit.js";
import { ActivityLog, Appointment, Branch, CatalogGroup, CatalogItem, Category, ChatbotConfig, ChatbotQa, Conversation, Inquiry, Invitation, MODULES, Membership, Message, NOTIFICATION_PREF_KEYS, Notification, Order, Organization, StaffProfile, User } from "../../models/index.js";
import { adminActor, logActivity } from "../../services/activity.js";
import { saveUpload } from "../../services/files.js";
import { notifyOrg } from "../../services/notifications.js";
import { publicOrg } from "../../services/orgs.js";
import { setPassword, verifyPassword } from "../../services/supabase-admin.js";

// Everything here assumes requireJwt + requireAdmin ran. Reads of tenant data are logged.
export const adminRouter = Router();

// ----- account -----
adminRouter.get("/me", wrap(async (req, res) => { req.admin!.lastLoginAt = new Date(); await req.admin!.save(); res.json({ admin: req.admin!.toJSON() }); }));
adminRouter.patch("/me", validate({ body: z.object({ name: z.string().trim().min(1).max(80).optional(), phone: z.string().max(32).optional() }) }), wrap(async (req, res) => { Object.assign(req.admin!, req.body); await req.admin!.save(); res.json({ admin: req.admin!.toJSON() }); }));
adminRouter.post("/me/avatar", uploadLimiter, imageUpload, wrap(async (req, res) => {
  const f = await saveUpload({ file: req.file, kind: "image", purpose: "avatar", uploaderType: "admin", uploaderId: String(req.admin!._id) });
  req.admin!.avatarUrl = f.url; await req.admin!.save(); res.json({ admin: req.admin!.toJSON(), file: f.toJSON() });
}));
const prefsSchema = z.object(Object.fromEntries(NOTIFICATION_PREF_KEYS.map((k) => [k, z.boolean().optional()])) as Record<(typeof NOTIFICATION_PREF_KEYS)[number], z.ZodOptional<z.ZodBoolean>>);
adminRouter.patch("/me/notification-preferences", validate({ body: prefsSchema }), wrap(async (req, res) => { req.admin!.set("notificationPrefs", { ...(req.admin!.toObject().notificationPrefs as object), ...req.body }); await req.admin!.save(); res.json({ notificationPrefs: req.admin!.notificationPrefs }); }));
adminRouter.post("/me/change-password", validate({ body: z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/[0-9]/) }) }), wrap(async (req, res) => { await verifyPassword(req.admin!.email, req.body.currentPassword); await setPassword(req.auth!.sub, req.body.newPassword); res.json({ ok: true }); }));

adminRouter.get("/notifications", validate({ query: pageQuery }), wrap(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof pageQuery>; const filter = { recipientType: "admin", recipientId: String(req.admin!._id) };
  const [items, total, unread] = await Promise.all([Notification.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.limit).lean(), Notification.countDocuments(filter), Notification.countDocuments({ ...filter, readAt: null })]);
  res.json({ ...paged(toJSONList(items), total, q), unread });
}));
adminRouter.patch("/notifications/:id/read", wrap(async (req, res) => { await Notification.updateOne({ _id: req.params.id, recipientId: String(req.admin!._id) }, { $set: { readAt: new Date() } }); res.json({ ok: true }); }));
adminRouter.post("/notifications/read-all", wrap(async (req, res) => { await Notification.updateMany({ recipientType: "admin", recipientId: String(req.admin!._id), readAt: null }, { $set: { readAt: new Date() } }); res.json({ ok: true }); }));

// ----- dashboard -----
adminRouter.get("/dashboard", wrap(async (_req, res) => {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [orgs, active, newOrgs7d, users, conversations, conv7d, needsHuman, orders, orders7d, appointments, inquiries, byCategory, recent, recentOrgs] = await Promise.all([
    Organization.countDocuments({ status: { $ne: "deleted" } }), Organization.countDocuments({ status: "active" }), Organization.countDocuments({ createdAt: { $gte: since } }), User.countDocuments(), Conversation.countDocuments(), Conversation.countDocuments({ createdAt: { $gte: since } }), Conversation.countDocuments({ status: "needs_human" }),
    Order.countDocuments(), Order.countDocuments({ createdAt: { $gte: since } }), Appointment.countDocuments(), Inquiry.countDocuments(),
    Organization.aggregate([{ $match: { status: { $ne: "deleted" } } }, { $group: { _id: "$categoryKey", n: { $sum: 1 } } }]), ActivityLog.find().sort({ createdAt: -1 }).limit(10).lean(), Organization.find({ status: { $ne: "deleted" } }).sort({ createdAt: -1 }).limit(5),
  ]);
  const cats = await Category.find().lean();
  res.json({ counts: { organizations: orgs, active, newOrgs7d, users, conversations, conversations7d: conv7d, needsHuman, orders, orders7d, appointments, inquiries }, byCategory: byCategory.map((c) => ({ key: c._id, name: cats.find((x) => x.key === c._id)?.name ?? c._id, count: c.n })), recentActivity: toJSONList(recent), recentOrganizations: recentOrgs.map(publicOrg) });
}));

// ----- categories (dynamic) -----
const categoryBody = z.object({ key: z.string().regex(/^[a-z0-9_]{2,32}$/), name: z.string().trim().min(2).max(60), description: z.string().max(500).optional(), icon: z.string().max(40).optional(), modules: z.array(z.enum(MODULES)).min(1), labels: z.object({ catalogGroup: z.string().max(40).optional(), catalogItem: z.string().max(40).optional(), staff: z.string().max(40).optional(), appointment: z.string().max(40).optional(), inquiry: z.string().max(40).optional() }).optional(), inquiryTypes: z.array(z.string().max(40)).max(10).optional(), isActive: z.boolean().optional(), sortOrder: z.number().int().optional() });
adminRouter.get("/categories", wrap(async (_req, res) => {
  const cats = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  const counts = await Organization.aggregate([{ $match: { status: { $ne: "deleted" } } }, { $group: { _id: "$categoryKey", n: { $sum: 1 } } }]);
  res.json({ items: cats.map((c) => ({ ...c, id: String(c._id), _id: undefined, organizationCount: counts.find((x) => x._id === c.key)?.n ?? 0 })), modules: MODULES });
}));
adminRouter.post("/categories", validate({ body: categoryBody }), wrap(async (req, res) => {
  if (await Category.exists({ key: req.body.key })) throw conflict("A category with this key already exists");
  const c = await Category.create(req.body);
  await logActivity({ actor: adminActor(req.admin!), action: "category.created", targetType: "category", targetId: c.key, summary: `${req.admin!.name || req.admin!.email} created category ${c.name}` });
  res.status(201).json({ category: c.toJSON() });
}));
adminRouter.patch("/categories/:key", validate({ body: categoryBody.partial().omit({ key: true }) }), wrap(async (req, res) => {
  const c = await Category.findOne({ key: req.params.key }); if (!c) throw notFound("Category not found");
  if (req.body.isActive === false && c.isSystem) throw badRequest("System categories can be hidden from signup but not disabled; set isActive on a copy instead");
  Object.assign(c, req.body); await c.save();
  await logActivity({ actor: adminActor(req.admin!), action: "category.updated", targetType: "category", targetId: c.key, summary: `${req.admin!.name || req.admin!.email} updated category ${c.name}` });
  res.json({ category: c.toJSON() });
}));

// ----- organizations -----
adminRouter.get("/organizations", validate({ query: pageQuery.extend({ q: z.string().max(100).optional(), categoryKey: z.string().optional(), status: z.enum(["active", "suspended", "deleted"]).optional() }) }), wrap(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof pageQuery> & { q?: string; categoryKey?: string; status?: string };
  const filter: Record<string, unknown> = { ...(q.categoryKey ? { categoryKey: q.categoryKey } : {}), ...(q.status ? { status: q.status } : {}), ...(q.q ? { $or: [{ name: { $regex: q.q, $options: "i" } }, { email: { $regex: q.q, $options: "i" } }, { slug: { $regex: q.q, $options: "i" } }] } : {}) };
  const [orgs, total] = await Promise.all([Organization.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.limit), Organization.countDocuments(filter)]);
  const ids = orgs.map((o) => o.uuid);
  const [members, convs, orders, cats, owners] = await Promise.all([
    Membership.aggregate([{ $match: { orgId: { $in: ids }, status: "active" } }, { $group: { _id: "$orgId", n: { $sum: 1 } } }]), Conversation.aggregate([{ $match: { orgId: { $in: ids } } }, { $group: { _id: "$orgId", n: { $sum: 1 } } }]), Order.aggregate([{ $match: { orgId: { $in: ids } } }, { $group: { _id: "$orgId", n: { $sum: 1 } } }]),
    Category.find({ key: { $in: orgs.map((o) => o.categoryKey) } }).lean(), User.find({ _id: { $in: orgs.map((o) => o.ownerUserId) } }, { name: 1, email: 1 }).lean(),
  ]);
  const n = (arr: { _id: string; n: number }[], id: string) => arr.find((a) => a._id === id)?.n ?? 0;
  res.json(paged(orgs.map((o) => ({ ...publicOrg(o), categoryName: cats.find((c) => c.key === o.categoryKey)?.name ?? o.categoryKey, owner: owners.find((u) => String(u._id) === o.ownerUserId) ?? null, memberCount: n(members, o.uuid), conversationCount: n(convs, o.uuid), orderCount: n(orders, o.uuid) })), total, q));
}));

const orgScoped = Router({ mergeParams: true });
adminRouter.use("/organizations/:orgId", loadOrgForAdmin, wrap(async (req, _res, next) => {
  await logActivity({ orgId: req.org!.uuid, actor: adminActor(req.admin!), action: "admin.viewed", targetType: "organization", targetId: req.org!.uuid, summary: `Admin ${req.admin!.name || req.admin!.email} viewed ${req.path === "/" ? "the organization" : req.path.replace(/^\//, "").split("/")[0]}` , meta: { path: req.path } });
  next();
}), orgScoped);

orgScoped.get("/", wrap(async (req, res) => {
  const orgId = req.org!.uuid;
  const [members, branches, qas, items, staff, convs, orders, appts, inqs, config, owner] = await Promise.all([
    Membership.countDocuments({ orgId, status: "active" }), Branch.countDocuments({ orgId }), ChatbotQa.countDocuments({ orgId }), CatalogItem.countDocuments({ orgId }), StaffProfile.countDocuments({ orgId }), Conversation.countDocuments({ orgId }), Order.countDocuments({ orgId }), Appointment.countDocuments({ orgId }), Inquiry.countDocuments({ orgId }),
    ChatbotConfig.findOne({ orgId }).lean(), User.findById(req.org!.ownerUserId, { name: 1, email: 1, phone: 1 }).lean(),
  ]);
  res.json({ organization: { ...publicOrg(req.org!), category: req.category ? { key: req.category.key, name: req.category.name, modules: req.category.modules, labels: req.category.labels } : null, owner, counts: { members, branches, qas, catalogItems: items, staff, conversations: convs, orders, appointments: appts, inquiries: inqs }, chatbot: config ? { name: config.name, isEnabled: config.isEnabled, greeting: config.greeting } : null } });
}));
orgScoped.patch("/status", validate({ body: z.object({ status: z.enum(["active", "suspended"]), reason: z.string().max(300).optional() }) }), wrap(async (req, res) => {
  req.org!.status = req.body.status; req.org!.suspendedReason = req.body.reason ?? ""; await req.org!.save();
  await logActivity({ orgId: req.org!.uuid, actor: adminActor(req.admin!), action: `org.${req.body.status}`, targetType: "organization", targetId: req.org!.uuid, summary: `Admin ${req.admin!.name || req.admin!.email} set ${req.org!.name} to ${req.body.status}${req.body.reason ? ": " + req.body.reason : ""}` });
  await notifyOrg(req.org!.uuid, { type: `org.${req.body.status}`, title: req.body.status === "suspended" ? `${req.org!.name} has been suspended` : `${req.org!.name} is active again`, body: req.body.reason ?? "" });
  res.json({ organization: publicOrg(req.org!) });
}));
orgScoped.get("/members", wrap(async (req, res) => {
  const ms = await Membership.find({ orgId: req.org!.uuid }).sort({ role: 1 }).lean(); const users = await User.find({ _id: { $in: ms.map((m) => m.userId) } }).lean();
  const invites = await Invitation.find({ orgId: req.org!.uuid, status: "pending" }).lean();
  res.json({ items: ms.map((m) => { const u = users.find((x) => String(x._id) === m.userId); return { id: m.userId, role: m.role, status: m.status, joinedAt: m.joinedAt, name: u?.name ?? "", email: u?.email ?? "", lastLoginAt: u?.lastLoginAt }; }), pendingInvitations: toJSONList(invites) });
}));
orgScoped.get("/branches", wrap(async (req, res) => res.json({ items: toJSONList(await Branch.find({ orgId: req.org!.uuid }).lean()) })));
orgScoped.get("/catalog", wrap(async (req, res) => res.json({ groups: toJSONList(await CatalogGroup.find({ orgId: req.org!.uuid }).sort({ sortOrder: 1 }).lean()), items: toJSONList(await CatalogItem.find({ orgId: req.org!.uuid }).sort({ sortOrder: 1 }).lean()) })));
orgScoped.get("/staff", wrap(async (req, res) => res.json({ items: toJSONList(await StaffProfile.find({ orgId: req.org!.uuid }).lean()) })));
orgScoped.get("/qas", wrap(async (req, res) => res.json({ config: (await ChatbotConfig.findOne({ orgId: req.org!.uuid }))?.toJSON() ?? null, items: toJSONList(await ChatbotQa.find({ orgId: req.org!.uuid }).sort({ createdAt: -1 }).lean()) })));
orgScoped.get("/conversations", validate({ query: pageQuery.extend({ status: z.string().optional() }) }), wrap(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof pageQuery> & { status?: string }; const filter = { orgId: req.org!.uuid, ...(q.status ? { status: q.status } : {}) };
  const [items, total] = await Promise.all([Conversation.find(filter).sort({ lastMessageAt: -1 }).skip(skip(q)).limit(q.limit).lean(), Conversation.countDocuments(filter)]); res.json(paged(toJSONList(items), total, q));
}));
orgScoped.get("/conversations/:id", wrap(async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!conv) throw notFound("Conversation not found");
  res.json({ conversation: conv.toJSON(), messages: toJSONList(await Message.find({ conversationId: String(conv._id) }).sort({ createdAt: 1 }).lean()) });
}));
for (const [path, Model] of [["/orders", Order], ["/appointments", Appointment], ["/inquiries", Inquiry]] as const) {
  orgScoped.get(path, validate({ query: pageQuery.extend({ status: z.string().optional() }) }), wrap(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof pageQuery> & { status?: string }; const filter = { orgId: req.org!.uuid, ...(q.status ? { status: q.status } : {}) }; const M = Model as typeof Order;
    const [items, total] = await Promise.all([M.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.limit).lean(), M.countDocuments(filter)]); res.json(paged(toJSONList(items), total, q));
  }));
}
orgScoped.get("/activity", validate({ query: pageQuery }), wrap(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof pageQuery>; const filter = { orgId: req.org!.uuid, action: { $ne: "admin.viewed" } };
  const [items, total] = await Promise.all([ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.limit).lean(), ActivityLog.countDocuments(filter)]); res.json(paged(toJSONList(items), total, q));
}));

// ----- cross-organization lists -----
async function withOrgNames<T extends { orgId?: string | null }>(items: T[]) { const names = await Organization.find({ uuid: { $in: [...new Set(items.map((i) => i.orgId).filter(Boolean))] } }, { uuid: 1, name: 1 }).lean(); return items.map((i) => ({ ...i, organizationName: names.find((n) => n.uuid === i.orgId)?.name ?? "" })); }
for (const [path, Model, sort] of [["/conversations", Conversation, { lastMessageAt: -1 }], ["/orders", Order, { createdAt: -1 }], ["/appointments", Appointment, { createdAt: -1 }], ["/inquiries", Inquiry, { createdAt: -1 }]] as const) {
  adminRouter.get(path, validate({ query: pageQuery.extend({ status: z.string().optional(), orgId: z.string().optional() }) }), wrap(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof pageQuery> & { status?: string; orgId?: string }; const filter = { ...(q.status ? { status: q.status } : {}), ...(q.orgId ? { orgId: q.orgId } : {}) }; const M = Model as typeof Order;
    const [items, total] = await Promise.all([M.find(filter).sort(sort as Record<string, 1 | -1>).skip(skip(q)).limit(q.limit).lean(), M.countDocuments(filter)]); res.json(paged(await withOrgNames(toJSONList(items) as { orgId?: string }[]), total, q));
  }));
}
adminRouter.get("/activity", validate({ query: pageQuery.extend({ orgId: z.string().optional() }) }), wrap(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof pageQuery> & { orgId?: string }; const filter = { action: { $ne: "admin.viewed" }, ...(q.orgId ? { orgId: q.orgId } : {}) };
  const [items, total] = await Promise.all([ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.limit).lean(), ActivityLog.countDocuments(filter)]); res.json(paged(await withOrgNames(toJSONList(items) as { orgId?: string }[]), total, q));
}));
adminRouter.get("/users", validate({ query: pageQuery.extend({ q: z.string().max(100).optional() }) }), wrap(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof pageQuery> & { q?: string }; const filter = q.q ? { $or: [{ name: { $regex: q.q, $options: "i" } }, { email: { $regex: q.q, $options: "i" } }] } : {};
  const [items, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.limit).lean(), User.countDocuments(filter)]);
  const ms = await Membership.find({ userId: { $in: items.map((u) => String(u._id)) }, status: "active" }).lean();
  res.json(paged(items.map((u) => ({ ...u, id: String(u._id), _id: undefined, organizations: ms.filter((m) => m.userId === String(u._id)).length })), total, q));
}));
