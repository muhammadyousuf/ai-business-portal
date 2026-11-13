// Shared status handling for orders, appointments and inquiries: history, system message to the customer, notifications.
import { Appointment, Conversation, Inquiry, Message, Order } from "../models/index.js";
import { logActivity, type Actor } from "./activity.js";
import { notifyOrg } from "./notifications.js";

type Kind = "order" | "appointment" | "inquiry";
const labels: Record<Kind, string> = { order: "Order", appointment: "Appointment", inquiry: "Inquiry" };
const humanStatus = (s: string) => s.replace(/_/g, " ");

export async function postSystemMessage(orgId: string, conversationId: string | undefined, text: string, meta: Record<string, unknown> = {}) {
  if (!conversationId) return;
  await Message.create({ orgId, conversationId, from: "system", text, meta });
  await Conversation.updateOne({ _id: conversationId, orgId }, { $set: { lastMessageAt: new Date(), lastMessagePreview: text } });
}

export async function applyStatus(kind: Kind, doc: InstanceType<typeof Order> | InstanceType<typeof Appointment> | InstanceType<typeof Inquiry>, status: string, actor: Actor, note = "") {
  const prev = doc.status;
  doc.status = status as never;
  doc.statusHistory.push({ status, by: actor.id ?? "system", byName: actor.name ?? "", note, at: new Date() });
  await doc.save();
  const label = labels[kind]; const num = `#${doc.number}`;
  const customerText = kind === "order"
    ? ({ confirmed: `Your order ${num} is confirmed. We'll let you know when it's ready.`, preparing: `Your order ${num} is being prepared.`, ready: `Your order ${num} is ready.`, completed: `Your order ${num} is complete. Thank you!`, cancelled: `Your order ${num} was cancelled.${note ? " " + note : ""}` } as Record<string, string>)[status]
    : ({ confirmed: `Your ${label.toLowerCase()} ${num} is confirmed.${note ? " " + note : ""}`, completed: `Your ${label.toLowerCase()} ${num} is marked complete. Thank you!`, cancelled: `Your ${label.toLowerCase()} ${num} was cancelled.${note ? " " + note : ""}`, in_progress: `We're working on your inquiry ${num}.`, resolved: `Your inquiry ${num} has been resolved.${note ? " " + note : ""}`, closed: `Your ${label.toLowerCase()} ${num} is closed.`, no_show: "" } as Record<string, string>)[status];
  if (customerText) await postSystemMessage(doc.orgId, doc.conversationId ?? undefined, customerText, { kind, id: String(doc._id), status });
  await logActivity({ orgId: doc.orgId, actor, action: `${kind}.status`, targetType: kind, targetId: String(doc._id), summary: `${actor.name || "System"} changed ${label.toLowerCase()} ${num} from ${humanStatus(prev)} to ${humanStatus(status)}` });
  await notifyOrg(doc.orgId, { type: `${kind}.status`, title: `${label} ${num} ${humanStatus(status)}`, body: note, link: `/${doc.orgId}/${kind === "inquiry" ? "inquiries" : kind + "s"}/${doc._id}` }, kind === "order" ? "newOrders" : "appointments", actor.type === "user" ? actor.id : undefined);
}
