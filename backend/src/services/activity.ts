import { ActivityLog } from "../models/index.js";

export interface Actor { type: "admin" | "user" | "bot" | "system"; id?: string; name?: string }
export async function logActivity(a: { orgId?: string; actor: Actor; action: string; targetType?: string; targetId?: string; summary: string; meta?: Record<string, unknown> }) {
  await ActivityLog.create({ orgId: a.orgId, actorType: a.actor.type, actorId: a.actor.id ?? "", actorName: a.actor.name ?? "", action: a.action, targetType: a.targetType ?? "", targetId: a.targetId ?? "", summary: a.summary, meta: a.meta ?? {} });
}
export const userActor = (u: { _id: unknown; name?: string; email?: string }): Actor => ({ type: "user", id: String(u._id), name: u.name || u.email });
export const adminActor = (a: { _id: unknown; name?: string; email?: string }): Actor => ({ type: "admin", id: String(a._id), name: a.name || a.email });
