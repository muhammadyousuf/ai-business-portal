import { AdminUser, Membership, Notification, Organization, User } from "../models/index.js";
import { env } from "../config/env.js";
import { sendNotificationEmail } from "./email.js";

export type PrefKey = "newOrders" | "newMessages" | "needsHuman" | "appointments" | "members";
export interface NotificationPayload { type: string; title: string; body?: string; link?: string; orgId?: string }

export async function notifyUsers(userIds: string[], payload: NotificationPayload, pref?: PrefKey) {
  if (!userIds.length) return 0;
  const users = await User.find({ _id: { $in: userIds } }, { notificationPrefs: 1, email: 1 }).lean();
  const targets = users.filter((u) => !pref || (u.notificationPrefs as Record<string, boolean> | undefined)?.[pref] !== false);
  if (!targets.length) return 0;
  await Notification.insertMany(targets.map((u) => ({ recipientType: "user", recipientId: String(u._id), orgId: payload.orgId, type: payload.type, title: payload.title, body: payload.body ?? "", link: payload.link ?? "" })));
  // Email copies go only to people who opted in (Account settings → Notifications → "Also email me").
  const emailTargets = targets.filter((u) => (u.notificationPrefs as Record<string, boolean> | undefined)?.email === true);
  if (emailTargets.length) {
    const orgName = payload.orgId ? (await Organization.findOne({ uuid: payload.orgId }, { name: 1 }).lean())?.name : undefined;
    const link = payload.link ? `${env.urls.userApp}${payload.link.startsWith("/") && !payload.link.startsWith("/org/") && !payload.link.startsWith("/invite/") ? "/org" : ""}${payload.link}` : undefined;
    await Promise.all(emailTargets.map((u) => sendNotificationEmail(u.email, { title: payload.title, body: payload.body, link }, orgName).catch(() => undefined)));
  }
  return targets.length;
}

export async function notifyOrg(orgId: string, payload: NotificationPayload, pref?: PrefKey, exceptUserId?: string) {
  const members = await Membership.find({ orgId, status: "active" }, { userId: 1 }).lean();
  const ids = members.map((m) => m.userId).filter((id) => id !== exceptUserId);
  return notifyUsers(ids, { ...payload, orgId }, pref);
}

export async function notifyAdmins(payload: NotificationPayload) {
  const admins = await AdminUser.find({}, { _id: 1, email: 1, notificationPrefs: 1 }).lean();
  if (!admins.length) return 0;
  await Notification.insertMany(admins.map((a) => ({ recipientType: "admin", recipientId: String(a._id), orgId: payload.orgId, type: payload.type, title: payload.title, body: payload.body ?? "", link: payload.link ?? "" })));
  const emailTargets = admins.filter((a) => (a.notificationPrefs as Record<string, boolean> | undefined)?.email === true);
  await Promise.all(emailTargets.map((a) => sendNotificationEmail(a.email, { title: payload.title, body: payload.body, link: payload.link ? `${env.urls.adminApp}${payload.link}` : undefined }).catch(() => undefined)));
  return admins.length;
}
