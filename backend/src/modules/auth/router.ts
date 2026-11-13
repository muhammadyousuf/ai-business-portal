import { Router } from "express";
import { z } from "zod";
import { wrap } from "../../lib/async.js";
import { validate } from "../../lib/validate.js";
import { authLimiter } from "../../middleware/rate-limit.js";
import { Category, User } from "../../models/index.js";
import { createAuthUser, deleteAuthUser } from "../../services/supabase-admin.js";
import { createOrganizationForUser, publicOrg } from "../../services/orgs.js";
import { logActivity, userActor } from "../../services/activity.js";

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
    res.status(201).json({ user: user.toJSON(), organization: publicOrg(org) });
  } catch (e) {
    await deleteAuthUser(authUser.id).catch(() => undefined); // keep auth and data consistent
    throw e;
  }
}));

// Public: active categories for the signup form.
authRouter.get("/categories", wrap(async (_req, res) => {
  const cats = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ items: cats.map((c) => ({ key: c.key, name: c.name, description: c.description, icon: c.icon, modules: c.modules, labels: c.labels })) });
}));
