import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { wrap } from "../../lib/async.js";
import { badRequest, conflict, forbidden, notFound } from "../../lib/http-error.js";
import { pageQuery, paged, skip } from "../../lib/pagination.js";
import { toJSONList } from "../../lib/serialize.js";
import { randomToken, sha256, widgetKey } from "../../lib/tokens.js";
import { validate } from "../../lib/validate.js";
import { requireOwner } from "../../middleware/org.js";
import { imageUpload, docUpload } from "../../middleware/upload.js";
import { uploadLimiter } from "../../middleware/rate-limit.js";
import { ActivityLog, Appointment, ChatbotConfig, Conversation, FileRecord, Inquiry, Invitation, Membership, Order, User, Branch, CatalogItem, ChatbotQa, StaffProfile } from "../../models/index.js";
import { logActivity, userActor } from "../../services/activity.js";
import { saveUpload } from "../../services/files.js";
import { notifyAdmins, notifyOrg, notifyUsers } from "../../services/notifications.js";
import { publicOrg } from "../../services/orgs.js";
import { findAuthUserByEmail, inviteByEmail } from "../../services/supabase-admin.js";

export const orgCoreRouter = Router({ mergeParams: true });

const addressSchema = z.object({ line1: z.string().max(200).optional(), line2: z.string().max(200).optional(), city: z.string().max(80).optional(), state: z.string().max(80).optional(), country: z.string().max(80).optional(), postalCode: z.string().max(20).optional() });

orgCoreRouter.get("/", wrap(async (req, res) => {
  const [members, cat] = await Promise.all([Membership.countDocuments({ orgId: req.org!.uuid, status: "active" }), Promise.resolve(req.category)]);
  res.json({ organization: { ...publicOrg(req.org!), memberCount: members, role: req.membership!.role, category: cat ? { key: cat.key, name: cat.name, modules: cat.modules, labels: cat.labels, inquiryTypes: cat.inquiryTypes } : null } });
}));

orgCoreRouter.patch("/", validate({ body: z.object({ name: z.string().trim().min(2).max(120).optional(), description: z.string().max(2000).optional(), website: z.string().max(200).optional(), phone: z.string().max(32).optional(), email: z.string().email().max(254).optional().or(z.literal("")), address: addressSchema.optional(), timezone: z.string().max(64).optional(), currency: z.string().max(8).optional(), allowedOrigins: z.array(z.string().url().max(200)).max(20).optional() }) }), wrap(async (req, res) => {
  const b = req.body;
  if (b.allowedOrigins && req.membership!.role !== "owner") throw forbidden("Only the owner can change allowed origins");
  if (b.address) req.org!.set("address", { ...(req.org!.toObject().address as object), ...b.address });
  const { address, ...rest } = b; void address;
  Object.assign(req.org!, rest);
  await req.org!.save();
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "org.updated", targetType: "organization", targetId: req.org!.uuid, summary: `${req.user!.name || req.user!.email} updated the organization profile` });
  res.json({ organization: publicOrg(req.org!) });
}));

orgCoreRouter.post("/logo", uploadLimiter, imageUpload, wrap(async (req, res) => {
  const f = await saveUpload({ file: req.file, kind: "image", purpose: "logo", orgId: req.org!.uuid, uploaderType: "user", uploaderId: String(req.user!._id) });
  req.org!.logoUrl = f.url; await req.org!.save();
  res.json({ organization: publicOrg(req.org!), file: f.toJSON() });
}));

orgCoreRouter.delete("/", requireOwner, validate({ body: z.object({ confirmName: z.string() }) }), wrap(async (req, res) => {
  if (req.body.confirmName.trim() !== req.org!.name) throw badRequest("Type the organization name exactly to confirm deletion");
  req.org!.status = "deleted"; req.org!.deletedAt = new Date(); await req.org!.save();
  await ChatbotConfig.updateOne({ orgId: req.org!.uuid }, { $set: { isEnabled: false } });
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "org.deleted", targetType: "organization", targetId: req.org!.uuid, summary: `${req.user!.name || req.user!.email} deleted the organization ${req.org!.name}` });
  await notifyOrg(req.org!.uuid, { type: "org.deleted", title: `${req.org!.name} was deleted`, body: "The owner deleted this organization. Data is retained for 30 days." }, undefined, String(req.user!._id));
  await notifyAdmins({ type: "org.deleted", title: `Organization deleted: ${req.org!.name}`, link: `/organizations/${req.org!.uuid}`, orgId: req.org!.uuid });
  res.json({ ok: true });
}));

orgCoreRouter.post("/transfer-ownership", requireOwner, validate({ body: z.object({ userId: z.string().min(1) }) }), wrap(async (req, res) => {
  const target = await Membership.findOne({ orgId: req.org!.uuid, userId: req.body.userId, status: "active" });
  if (!target) throw notFound("That user is not an active member");
  if (target.userId === String(req.user!._id)) throw badRequest("You are already the owner");
  target.role = "owner"; await target.save();
  req.membership!.role = "member"; await req.membership!.save();
  req.org!.ownerUserId = target.userId; await req.org!.save();
  const u = await User.findById(target.userId);
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "org.ownership_transferred", targetType: "user", targetId: target.userId, summary: `${req.user!.name || req.user!.email} transferred ownership to ${u?.name || u?.email}` });
  await notifyUsers([target.userId], { type: "org.ownership", title: `You are now the owner of ${req.org!.name}`, link: `/${req.org!.uuid}`, orgId: req.org!.uuid });
  res.json({ ok: true, ownerUserId: target.userId });
}));

// ----- members -----
orgCoreRouter.get("/members", wrap(async (req, res) => {
  const ms = await Membership.find({ orgId: req.org!.uuid, status: "active" }).sort({ role: 1, joinedAt: 1 }).lean();
  const users = await User.find({ _id: { $in: ms.map((m) => m.userId) } }).lean();
  res.json({ items: ms.map((m) => { const u = users.find((x) => String(x._id) === m.userId); return { id: m.userId, membershipId: String(m._id), role: m.role, joinedAt: m.joinedAt, name: u?.name ?? "", email: u?.email ?? "", avatarUrl: u?.avatarUrl ?? "", lastLoginAt: u?.lastLoginAt }; }) });
}));

orgCoreRouter.delete("/members/:userId", requireOwner, wrap(async (req, res) => {
  if (req.params.userId === String(req.user!._id)) throw badRequest("Owners cannot remove themselves. Transfer ownership first.");
  const m = await Membership.findOne({ orgId: req.org!.uuid, userId: req.params.userId, status: "active" });
  if (!m) throw notFound("Member not found");
  m.status = "removed"; m.removedAt = new Date(); await m.save();
  const u = await User.findById(m.userId);
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "member.removed", targetType: "user", targetId: m.userId, summary: `${req.user!.name || req.user!.email} removed ${u?.name || u?.email} from the organization` });
  await notifyUsers([m.userId], { type: "member.removed", title: `You were removed from ${req.org!.name}`, orgId: req.org!.uuid });
  res.json({ ok: true });
}));

orgCoreRouter.post("/leave", wrap(async (req, res) => {
  if (req.membership!.role === "owner") throw badRequest("Owners cannot leave. Transfer ownership first or delete the organization.");
  req.membership!.status = "removed"; req.membership!.removedAt = new Date(); await req.membership!.save();
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "member.left", targetType: "user", targetId: String(req.user!._id), summary: `${req.user!.name || req.user!.email} left the organization` });
  await notifyUsers([req.org!.ownerUserId], { type: "member.left", title: `${req.user!.name || req.user!.email} left ${req.org!.name}`, link: `/${req.org!.uuid}/members`, orgId: req.org!.uuid }, "members");
  res.json({ ok: true });
}));

// ----- invitations (members may invite; only owners revoke others') -----
orgCoreRouter.get("/invitations", wrap(async (req, res) => {
  const items = await Invitation.find({ orgId: req.org!.uuid, status: "pending" }).sort({ createdAt: -1 }).lean();
  const inviters = await User.find({ _id: { $in: items.map((i) => i.invitedBy) } }, { name: 1, email: 1 }).lean();
  res.json({ items: items.map((i) => ({ id: String(i._id), email: i.email, role: i.role, status: i.status, expiresAt: i.expiresAt, emailSent: i.emailSent, invitedBy: inviters.find((u) => String(u._id) === i.invitedBy)?.name || inviters.find((u) => String(u._id) === i.invitedBy)?.email || "", createdAt: i.createdAt })) });
}));

orgCoreRouter.post("/invitations", validate({ body: z.object({ emails: z.array(z.string().email().max(254)).min(1).max(20), role: z.enum(["member"]).default("member") }) }), wrap(async (req, res) => {
  const results = [];
  for (const raw of req.body.emails as string[]) {
    const email = raw.toLowerCase();
    const existingUser = await User.findOne({ email });
    if (existingUser && (await Membership.exists({ orgId: req.org!.uuid, userId: String(existingUser._id), status: "active" }))) { results.push({ email, status: "already_member" }); continue; }
    await Invitation.updateMany({ orgId: req.org!.uuid, email, status: "pending" }, { $set: { status: "revoked" } });
    const token = randomToken();
    const inv = await Invitation.create({ orgId: req.org!.uuid, email, role: req.body.role, tokenHash: sha256(token), invitedBy: String(req.user!._id), expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) });
    const link = `${env.urls.userApp}/invite/${token}`;
    let emailSent = false; let delivery = "link";
    if (existingUser) {
      await notifyUsers([String(existingUser._id)], { type: "invitation", title: `${req.user!.name || req.user!.email} invited you to ${req.org!.name}`, body: "Open the invitation to join.", link: `/invite/${token}`, orgId: req.org!.uuid });
      delivery = "in_app";
    } else if (!(await findAuthUserByEmail(email))) {
      const r = await inviteByEmail(email, link, { invitationToken: token, orgName: req.org!.name });
      emailSent = r.sent; delivery = r.sent ? "email" : `link (email not sent: ${r.reason})`;
    }
    inv.emailSent = emailSent; inv.lastSentAt = new Date(); await inv.save();
    await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "member.invited", targetType: "invitation", targetId: String(inv._id), summary: `${req.user!.name || req.user!.email} invited ${email}` });
    results.push({ email, status: "invited", id: String(inv._id), link, delivery, expiresAt: inv.expiresAt });
  }
  res.status(201).json({ results });
}));

orgCoreRouter.delete("/invitations/:id", wrap(async (req, res) => {
  const inv = await Invitation.findOne({ _id: req.params.id, orgId: req.org!.uuid });
  if (!inv) throw notFound("Invitation not found");
  if (req.membership!.role !== "owner" && inv.invitedBy !== String(req.user!._id)) throw forbidden("Only the owner can revoke other people's invitations");
  inv.status = "revoked"; await inv.save(); res.json({ ok: true });
}));

orgCoreRouter.post("/invitations/:id/resend", wrap(async (req, res) => {
  const inv = await Invitation.findOne({ _id: req.params.id, orgId: req.org!.uuid, status: "pending" });
  if (!inv) throw notFound("Pending invitation not found");
  const token = randomToken(); inv.tokenHash = sha256(token); inv.expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const link = `${env.urls.userApp}/invite/${token}`;
  const existingUser = await User.findOne({ email: inv.email });
  let delivery = "link";
  if (existingUser) { await notifyUsers([String(existingUser._id)], { type: "invitation", title: `Reminder: you are invited to ${req.org!.name}`, link: `/invite/${token}`, orgId: req.org!.uuid }); delivery = "in_app"; }
  else if (!(await findAuthUserByEmail(inv.email))) { const r = await inviteByEmail(inv.email, link, { invitationToken: token, orgName: req.org!.name }); inv.emailSent = r.sent; delivery = r.sent ? "email" : "link"; }
  inv.lastSentAt = new Date(); await inv.save();
  res.json({ id: String(inv._id), link, delivery, expiresAt: inv.expiresAt });
}));

// ----- widget key (owner) -----
orgCoreRouter.post("/rotate-widget-key", requireOwner, wrap(async (req, res) => {
  req.org!.widgetKey = widgetKey(); await req.org!.save();
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "org.widget_key_rotated", targetType: "organization", targetId: req.org!.uuid, summary: `${req.user!.name || req.user!.email} rotated the widget key` });
  res.json({ widgetKey: req.org!.widgetKey });
}));

// ----- dashboard, activity, files -----
orgCoreRouter.get("/dashboard", wrap(async (req, res) => {
  const orgId = req.org!.uuid; const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [conversations, needsHuman, openOrders, orders7d, appointments, inquiries, qas, items, branches, staff, members, recent] = await Promise.all([
    Conversation.countDocuments({ orgId }), Conversation.countDocuments({ orgId, status: "needs_human" }), Order.countDocuments({ orgId, status: { $in: ["pending", "confirmed", "preparing", "ready"] } }), Order.countDocuments({ orgId, createdAt: { $gte: since } }),
    Appointment.countDocuments({ orgId, status: "requested" }), Inquiry.countDocuments({ orgId, status: "new" }), ChatbotQa.countDocuments({ orgId, isActive: true }), CatalogItem.countDocuments({ orgId }), Branch.countDocuments({ orgId, isActive: true }), StaffProfile.countDocuments({ orgId, isActive: true }), Membership.countDocuments({ orgId, status: "active" }),
    ActivityLog.find({ orgId }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);
  res.json({ counts: { conversations, needsHuman, openOrders, orders7d, appointmentsRequested: appointments, inquiriesNew: inquiries, qas, catalogItems: items, branches, staff, members }, recentActivity: toJSONList(recent), checklist: { profile: !!req.org!.description || !!req.org!.phone, qa: qas > 0, catalog: items > 0, widgetOrigin: req.org!.allowedOrigins.length > 0 } });
}));

orgCoreRouter.get("/activity", validate({ query: pageQuery }), wrap(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof pageQuery>;
  const [items, total] = await Promise.all([ActivityLog.find({ orgId: req.org!.uuid }).sort({ createdAt: -1 }).skip(skip(q)).limit(q.limit).lean(), ActivityLog.countDocuments({ orgId: req.org!.uuid })]);
  res.json(paged(toJSONList(items), total, q));
}));

orgCoreRouter.get("/files", validate({ query: pageQuery }), wrap(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof pageQuery>;
  const [items, total] = await Promise.all([FileRecord.find({ orgId: req.org!.uuid }).sort({ createdAt: -1 }).skip(skip(q)).limit(q.limit).lean(), FileRecord.countDocuments({ orgId: req.org!.uuid })]);
  res.json(paged(toJSONList(items), total, q));
}));

orgCoreRouter.post("/files", uploadLimiter, docUpload, validate({ query: z.object({ purpose: z.enum(["catalog", "branch", "staff", "qa", "general", "logo"]).default("general") }) }), wrap(async (req, res) => {
  const f = await saveUpload({ file: req.file, kind: "doc", purpose: (req.query as { purpose: string }).purpose, orgId: req.org!.uuid, uploaderType: "user", uploaderId: String(req.user!._id) });
  res.status(201).json({ file: f.toJSON() });
}));

orgCoreRouter.delete("/files/:id", wrap(async (req, res) => {
  const f = await FileRecord.findOne({ _id: req.params.id, orgId: req.org!.uuid });
  if (!f) throw notFound("File not found");
  const { removeFile } = await import("../../services/storage.js");
  await removeFile({ provider: f.provider, providerId: f.providerId }); await f.deleteOne();
  res.json({ ok: true });
}));

export { conflict };
