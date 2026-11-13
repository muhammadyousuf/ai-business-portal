import { Branch, Category, ChatbotConfig, Membership, Organization, type UserDoc } from "../models/index.js";
import { badRequest } from "../lib/http-error.js";
import { slugify, uuid, widgetKey } from "../lib/tokens.js";
import { logActivity, userActor } from "./activity.js";
import { notifyAdmins } from "./notifications.js";

export async function createOrganizationForUser(user: UserDoc, input: { name: string; categoryKey: string; phone?: string; city?: string; country?: string }) {
  const category = await Category.findOne({ key: input.categoryKey, isActive: true });
  if (!category) throw badRequest("Unknown or inactive category");
  let slug = slugify(input.name);
  if (await Organization.exists({ slug })) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  const org = await Organization.create({
    uuid: uuid(), name: input.name.trim(), slug, categoryKey: category.key, ownerUserId: String(user._id), widgetKey: widgetKey(),
    phone: input.phone ?? "", email: user.email, address: { city: input.city ?? "", country: input.country ?? "Pakistan" },
  });
  await Membership.create({ orgId: org.uuid, userId: String(user._id), role: "owner" });
  await Branch.create({ orgId: org.uuid, name: "Main branch", isMain: true, phone: input.phone ?? "", address: { city: input.city ?? "", country: input.country ?? "Pakistan" } });
  await ChatbotConfig.create({ orgId: org.uuid, name: `${org.name} assistant`, greeting: `Hi! Welcome to ${org.name}. How can I help you today?` });
  await logActivity({ orgId: org.uuid, actor: userActor(user), action: "org.created", targetType: "organization", targetId: org.uuid, summary: `${user.name || user.email} created the organization ${org.name} (${category.name})` });
  await notifyAdmins({ type: "org.created", title: `New organization: ${org.name}`, body: `${category.name} · owner ${user.email}`, link: `/organizations/${org.uuid}`, orgId: org.uuid });
  return org;
}

export function publicOrg(org: InstanceType<typeof Organization>) {
  const o = org.toObject();
  return { id: o.uuid, uuid: o.uuid, name: o.name, slug: o.slug, categoryKey: o.categoryKey, description: o.description, logoUrl: o.logoUrl, website: o.website, phone: o.phone, email: o.email, address: o.address, timezone: o.timezone, currency: o.currency, ownerUserId: o.ownerUserId, status: o.status, widgetKey: o.widgetKey, allowedOrigins: o.allowedOrigins, createdAt: o.createdAt, updatedAt: o.updatedAt, deletedAt: o.deletedAt };
}
