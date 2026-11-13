import { Router } from "express";
import { z } from "zod";
import { validate } from "../../lib/validate.js";
import { authLimiter } from "../../middleware/rate-limit.js";
import { createAuthUser, findAuthUserByEmail, setPassword } from "../../services/supabase-admin.js";
import { wrap } from "../../lib/async.js";
import { badRequest, forbidden, notFound } from "../../lib/http-error.js";
import { sha256 } from "../../lib/tokens.js";
import { requireJwt, requireUser } from "../../middleware/auth.js";
import { Category, Invitation, Membership, Organization, User } from "../../models/index.js";
import { logActivity, userActor } from "../../services/activity.js";
import { notifyUsers } from "../../services/notifications.js";

// Token-based invitation endpoints (not org-scoped: the visitor may not be a member yet).
export const invitationsRouter = Router();

async function loadInvitation(token: string) {
  const inv = await Invitation.findOne({ tokenHash: sha256(token) });
  if (!inv) throw notFound("Invitation not found");
  if (inv.status === "pending" && inv.expiresAt < new Date()) { inv.status = "expired"; await inv.save(); }
  const org = await Organization.findOne({ uuid: inv.orgId, status: "active" });
  if (!org) throw notFound("This organization is no longer available");
  return { inv, org };
}

// Public preview: enough to render the accept page.
invitationsRouter.get("/:token", wrap(async (req, res) => {
  const { inv, org } = await loadInvitation(req.params.token);
  const cat = await Category.findOne({ key: org.categoryKey }).lean();
  const inviter = await User.findById(inv.invitedBy).lean();
  const existing = await User.exists({ email: inv.email });
  res.json({ invitation: { email: inv.email, role: inv.role, status: inv.status, expiresAt: inv.expiresAt, organization: { id: org.uuid, name: org.name, logoUrl: org.logoUrl, category: cat?.name ?? org.categoryKey }, invitedBy: inviter?.name || inviter?.email || "", accountExists: !!existing } });
}));

async function acceptInvitation(inv: Awaited<ReturnType<typeof loadInvitation>>["inv"], org: Awaited<ReturnType<typeof loadInvitation>>["org"], user: NonNullable<import("express").Request["user"]>) {
  if (inv.status !== "pending") throw badRequest(`This invitation is ${inv.status}`);
  if (inv.email !== user.email) throw forbidden(`This invitation was sent to ${inv.email}. Sign in with that email to accept it.`);
  const existing = await Membership.findOne({ orgId: org.uuid, userId: String(user._id) });
  if (existing && existing.status === "active") { inv.status = "accepted"; inv.acceptedBy = String(user._id); inv.acceptedAt = new Date(); await inv.save(); return { organization: { id: org.uuid, name: org.name }, role: existing.role, alreadyMember: true }; }
  if (existing) { existing.status = "active"; existing.role = inv.role; existing.joinedAt = new Date(); existing.removedAt = undefined; existing.invitedBy = inv.invitedBy; await existing.save(); }
  else await Membership.create({ orgId: org.uuid, userId: String(user._id), role: inv.role, invitedBy: inv.invitedBy });
  inv.status = "accepted"; inv.acceptedBy = String(user._id); inv.acceptedAt = new Date(); await inv.save();
  await logActivity({ orgId: org.uuid, actor: userActor(user), action: "member.joined", targetType: "user", targetId: String(user._id), summary: `${user.name || user.email} joined ${org.name} as ${inv.role}` });
  await notifyUsers([inv.invitedBy], { type: "member.joined", title: `${user.name || user.email} joined ${org.name}`, body: "They accepted your invitation.", link: `/${org.uuid}/members`, orgId: org.uuid }, "members");
  return { organization: { id: org.uuid, name: org.name }, role: inv.role };
}

// Accept: the signed-in user's email must match the invitation.
invitationsRouter.post("/:token/accept", requireJwt, requireUser, wrap(async (req, res) => {
  const { inv, org } = await loadInvitation(req.params.token);
  res.json(await acceptInvitation(inv, org, req.user!));
}));

// New invitee without an account: create (or finish) the auth user server-side, then accept. The client signs in afterwards.
invitationsRouter.post("/:token/signup", authLimiter, validate({ body: z.object({ name: z.string().trim().min(2).max(80), password: z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/[0-9]/) }) }), wrap(async (req, res) => {
  const { inv, org } = await loadInvitation(req.params.token);
  if (inv.status !== "pending") throw badRequest(`This invitation is ${inv.status}`);
  if (await User.exists({ email: inv.email })) throw badRequest("An account already exists for this email. Sign in to accept the invitation.");
  const existingAuth = await findAuthUserByEmail(inv.email);
  let supabaseId: string;
  if (existingAuth) { await setPassword(existingAuth.id, req.body.password, { confirmEmail: true, meta: { name: req.body.name } }); supabaseId = existingAuth.id; }
  else supabaseId = (await createAuthUser(inv.email, req.body.password, { name: req.body.name })).id;
  const user = await User.create({ supabaseId, email: inv.email, name: req.body.name });
  res.status(201).json(await acceptInvitation(inv, org, user));
}));
