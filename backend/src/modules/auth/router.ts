import { Router } from "express";
import { z } from "zod";
import { wrap } from "../../lib/async.js";
import { validate } from "../../lib/validate.js";
import { authLimiter } from "../../middleware/rate-limit.js";
import { AdminUser, Category, User } from "../../models/index.js";
import { env } from "../../config/env.js";
import { generateRecoveryToken } from "../../services/supabase-admin.js";
import { sendPasswordReset } from "../../services/email.js";
import { createAuthUser, deleteAuthUser } from "../../services/supabase-admin.js";
import { createOrganizationForUser, publicOrg } from "../../services/orgs.js";
import { logActivity, userActor } from "../../services/activity.js";
import { issueVerification } from "../../services/verification.js";

export const authRouter = Router();

const password = z.string().min(8, "Password must be at least 8 characters").max(72).regex(/[A-Za-z]/, "Password needs a letter").regex(/[0-9]/, "Password needs a number");

// Server-side signup: creates the Supabase user (auto-confirmed), the Mongo user, the organization and the owner membership.
authRouter.post("/signup", authLimiter, validate({ body: z.object({ email: z.string().email().max(254), password, name: z.string().trim().min(2).max(80), orgName: z.string().trim().min(2).max(120), categoryKey: z.string().min(1), phone: z.string().trim().max(32).optional(), city: z.string().trim().max(80).optional(), country: z.string().trim().max(80).optional() }) }), wrap(async (req, res) => {
  const b = req.body;
  const email = b.email.toLowerCase();
  if (!(await Category.exists({ key: b.categoryKey, isActive: true }))) return res.status(400).json({ error: "Unknown category", code: "bad_request" });
  const authUser = await createAuthUser(email, b.password, { name: b.name });
  try {
    const user = await User.create({ supabaseId: authUser.id, email, name: b.name, phone: b.phone ?? "" });
    const org = await createOrganizationForUser(user, { name: b.orgName, categoryKey: b.categoryKey, phone: b.phone, city: b.city, country: b.country });
    await logActivity({ actor: userActor(user), action: "user.signup", targetType: "user", targetId: String(user._id), summary: `${email} signed up` });
    const verification = await issueVerification(user, org.name).catch((e: Error) => ({ sent: false, reason: e.message }));
    res.status(201).json({ user: user.toJSON(), organization: publicOrg(org), verification });
  } catch (e) {
    await deleteAuthUser(authUser.id).catch(() => undefined); // keep auth and data consistent
    throw e;
  }
}));

// Forgot password: always answers 200 so email addresses cannot be enumerated. Admin requests only act
// for admin accounts; client requests only for client accounts.
authRouter.post("/forgot-password", authLimiter, validate({ body: z.object({ email: z.string().email().max(254), portal: z.enum(["admin", "client"]).default("client") }) }), wrap(async (req, res) => {
  const email = req.body.email.toLowerCase(); const portal = req.body.portal as "admin" | "client";
  const exists = portal === "admin" ? await AdminUser.exists({ email }) : await User.exists({ email });
  let delivery: string = "none";
  if (exists) {
    const tokenHash = await generateRecoveryToken(email);
    if (tokenHash) {
      const base = portal === "admin" ? env.urls.adminApp : env.urls.userApp;
      const link = `${base}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&next=/reset-password`;
      const r = await sendPasswordReset(email, link, portal);
      delivery = r.sent ? "email" : r.reason;
      if (!r.sent && env.isDev) (res.locals as Record<string, unknown>).devLink = link;
    }
  }
  res.json({ ok: true, message: "If an account exists for that email, a reset link has been sent.", ...(env.isDev && (res.locals as Record<string, unknown>).devLink ? { devLink: (res.locals as Record<string, unknown>).devLink, delivery } : {}) });
}));

// Public: active categories for the signup form.
authRouter.get("/categories", wrap(async (_req, res) => {
  const cats = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ items: cats.map((c) => ({ key: c.key, name: c.name, description: c.description, icon: c.icon, modules: c.modules, labels: c.labels })) });
}));
