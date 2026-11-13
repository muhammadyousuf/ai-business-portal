import { AdminUser, Membership, Notification, User } from "../models/index.js";

export type PrefKey = "newOrders" | "newMessages" | "needsHuman" | "appointments" | "members";
export interface NotificationPayload { type: string; title: string; body?: string; link?: string; orgId?: string }

export async function notifyUsers(userIds: string[], payload: NotificationPayload, pref?: PrefKey) {
  if (!userIds.length) return 0;
  const users = await User.find({ _id: { $in: userIds } }, { notificationPrefs: 1 }).lean();
  const targets = users.filter((u) => !pref || (u.notificationPrefs as Record<string, boolean> | undefined)?.[pref] !== false);
  if (!targets.length) return 0;
  await Notification.insertMany(targets.map((u) => ({ recipientType: "user", recipientId: String(u._id), orgId: payload.orgId, type: payload.type, title: payload.title, body: payload.body ?? "", link: payload.link ?? "" })));
  return targets.length;
}

export async function notifyOrg(orgId: string, payload: NotificationPayload, pref?: PrefKey, exceptUserId?: string) {
  const members = await Membership.find({ orgId, status: "active" }, { userId: 1 }).lean();
  const ids = members.map((m) => m.userId).filter((id) => id !== exceptUserId);
  return notifyUsers(ids, { ...payload, orgId }, pref);
}

export async function notifyAdmins(payload: NotificationPayload) {
  const admins = await AdminUser.find({}, { _id: 1 }).lean();
  if (!admins.length) return 0;
  await Notification.insertMany(admins.map((a) => ({ recipientType: "admin", recipientId: String(a._id), orgId: payload.orgId, type: payload.type, title: payload.title, body: payload.body ?? "", link: payload.link ?? "" })));
  return admins.length;
}
