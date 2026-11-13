// Rule-based responder. Same contract an AI provider will implement later:
// every factual answer comes from the organization's data; unknowns fall back and escalate.
import type { Document } from "mongoose";
import { includesAny, normalize, tokens } from "../../lib/text.js";
import { Appointment, Branch, CatalogGroup, CatalogItem, ChatbotQa, Conversation, Inquiry, Order, StaffProfile, UnansweredQuestion, type CategoryDoc, type ChatbotConfigDoc, type OrganizationDoc } from "../../models/index.js";
import { nextNumber } from "../counters.js";
import { notifyOrg } from "../notifications.js";
import { logActivity } from "../activity.js";
import { bestQa } from "./matcher.js";

export interface BotReply { text: string; quickReplies?: string[]; tool?: string; needsContact?: boolean; handover?: boolean; created?: { kind: "order" | "appointment" | "inquiry"; id: string; number: number } }
type Conv = Document & { orgId: string; status: string; customer: { name: string; phone: string; email: string; address: string }; botState: Record<string, unknown>; fallbackStreak: number; branchId?: string };

const money = (n: number, cur: string) => `${cur === "PKR" ? "Rs." : cur} ${n.toLocaleString("en-PK")}`;
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export async function respond(org: OrganizationDoc, category: CategoryDoc | undefined, config: ChatbotConfigDoc, conv: Conv, raw: string): Promise<BotReply> {
  const text = normalize(raw);
  const has = (...w: string[]) => includesAny(raw, w);
  const modules = new Set(category?.modules ?? []);
  const labels = category?.labels ?? { catalogGroup: "Category", catalogItem: "Item", staff: "Staff", appointment: "Appointment", inquiry: "Inquiry" };
  const state = (conv.botState ?? {}) as { pending?: { kind: "order" | "appointment" | "inquiry"; payload: Record<string, unknown> } };

  const escalate = async (reason: string): Promise<BotReply> => {
    if (conv.status !== "human") conv.status = "needs_human";
    conv.fallbackStreak = 0;
    await logActivity({ orgId: org.uuid, actor: { type: "bot", name: config.name }, action: "conversation.needs_human", targetType: "conversation", targetId: String(conv._id), summary: `Chatbot handed a conversation to the team (${reason})` });
    await notifyOrg(org.uuid, { type: "conversation.needs_human", title: "A customer needs a human", body: raw.slice(0, 140), link: `/${org.uuid}/inbox/${conv._id}` }, "needsHuman");
    return { text: "I'll get a member of the team to continue this chat. They'll reply right here.", tool: "handoverToHuman", handover: true };
  };

  // 1. Explicit handover
  if (has(...(config.handoverKeywords ?? []), "talk to a person", "real person", "speak to someone")) return escalate("customer asked for a person");

  // 2. Pending contact-collection step for an order/appointment/inquiry
  if (state.pending && (!conv.customer.name || !conv.customer.phone)) {
    const phone = raw.match(/(\+?\d[\d\s-]{7,}\d)/)?.[1]?.replace(/[\s-]/g, "");
    const name = raw.split(/[,\n]/)[0].trim();
    if (phone && name && name.length >= 2 && !/\d{5,}/.test(name)) {
      conv.customer.name = name; conv.customer.phone = phone;
      const addr = raw.split(/[,\n]/).slice(2).join(",").trim(); if (addr) conv.customer.address = addr;
      return finalizePending();
    }
    return { text: "Please share your name and phone number (and address for delivery), for example: Ali Raza, 0300 1234567, House 12, Street 4.", needsContact: true };
  }

  // 3. Configured Q&A
  const qas = await ChatbotQa.find({ orgId: org.uuid, isActive: true, ...(conv.branchId ? { $or: [{ branchId: conv.branchId }, { branchId: { $in: ["", null] } }] } : {}) }).lean();
  const match = bestQa(raw, qas.map((q) => ({ id: String(q._id), question: q.question, answer: q.answer, keywords: q.keywords })));
  if (match) {
    await ChatbotQa.updateOne({ _id: match.qa.id }, { $inc: { hits: 1 } });
    conv.fallbackStreak = 0;
    return { text: match.qa.answer, tool: "answerFromQa", quickReplies: suggestions() };
  }

  // 4. Category intents
  const branches = modules.has("branches") ? await Branch.find({ orgId: org.uuid, isActive: true }).lean() : [];
  if (modules.has("branches") && branches.length && has("where", "address", "location", "branch", "timing", "timings", "hours", "open", "close", "kahan")) {
    conv.fallbackStreak = 0;
    const lines = branches.map((b) => { const a = [b.address?.line1, b.address?.city].filter(Boolean).join(", "); const today = b.hours?.find((h) => h.day === new Date().getDay()); const hrs = today ? (today.closed ? "closed today" : `today ${today.open}–${today.close}`) : ""; return `${b.name}${a ? ": " + a : ""}${b.phone ? " · " + b.phone : ""}${hrs ? " · " + hrs : ""}`; });
    return { text: (branches.length > 1 ? "Our branches:\n" : "") + lines.join("\n"), tool: "getBranches" };
  }

  const items = modules.has("catalog") ? await CatalogItem.find({ orgId: org.uuid, isAvailable: true }).lean() : [];
  const groups = modules.has("catalog") ? await CatalogGroup.find({ orgId: org.uuid, isActive: true }).lean() : [];
  const matchItems = items.filter((it) => { const n = normalize(it.name); return n && (text.includes(n) || tokens(it.name).some((t) => t.length > 3 && text.includes(t))); });

  // Order intent (restaurant-like)
  if (modules.has("orders") && matchItems.length && (/\b\d+\b/.test(text) || has("order", "want", "chahiye", "send", "deliver"))) {
    const cart = matchItems.map((it) => { const m = text.match(new RegExp(`(\\d+)\\s*(x|×|plates?|pcs?|of)?\\s*${normalize(it.name).split(" ")[0]}`)) ?? text.match(new RegExp(`${normalize(it.name).split(" ")[0]}\\s*(x|×)?\\s*(\\d+)`)); const qty = Number(m?.[1] ?? m?.[2] ?? 1) || 1; return { itemId: String(it._id), name: it.name, qty, unitPrice: it.price }; });
    const subtotal = cart.reduce((t, i) => t + i.qty * i.unitPrice, 0);
    const main = branches.find((b) => b.isMain) ?? branches[0];
    const delivery = main?.deliveryCharge ?? 0;
    conv.botState = { pending: { kind: "order", payload: { cart, subtotal, delivery, branchId: main ? String(main._id) : undefined } } };
    const summary = cart.map((c) => `${c.qty} × ${c.name} (${money(c.qty * c.unitPrice, org.currency)})`).join(", ");
    if (!conv.customer.name || !conv.customer.phone) return { text: `Got it: ${summary}. Total ${money(subtotal + delivery, org.currency)}${delivery ? ` including ${money(delivery, org.currency)} delivery` : ""}. Please share your name, phone number and address.`, tool: "createOrderRequest", needsContact: true };
    return finalizePending();
  }

  // Appointment intent
  const staff = modules.has("staff") ? await StaffProfile.find({ orgId: org.uuid, isActive: true }).lean() : [];
  const matchStaff = staff.filter((s) => { const n = normalize(s.name); return tokens(s.name).some((t) => t.length > 2 && text.includes(t)) || text.includes(n); });
  if (modules.has("appointments") && has("appointment", "book", "booking", "schedule", "slot", "reserve", "consult")) {
    const svc = matchItems[0]?.name ?? "";
    const dayIdx = DAYS.findIndex((d) => text.includes(d));
    const time = raw.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)?.[0] ?? "";
    conv.botState = { pending: { kind: "appointment", payload: { staffId: matchStaff[0] ? String(matchStaff[0]._id) : undefined, staffName: matchStaff[0]?.name ?? "", service: svc, requestedText: [dayIdx >= 0 ? DAYS[dayIdx] : "", time].filter(Boolean).join(" ") || raw.slice(0, 120) } } };
    if (!conv.customer.name || !conv.customer.phone) return { text: `I can request ${labels.appointment.toLowerCase()}${matchStaff[0] ? ` with ${matchStaff[0].name}` : ""}${svc ? ` for ${svc}` : ""}. Please share your name and phone number so the team can confirm the time.`, tool: "requestAppointment", needsContact: true };
    return finalizePending();
  }

  // Inquiry intent
  if (modules.has("inquiries") && has("admission", "admissions", "enroll", "enrol", "membership", "join", "register", "inquiry", "enquiry", "fees", "fee structure")) {
    const type = has("admission", "admissions", "enroll", "enrol") ? "admission" : has("membership", "join") ? "membership" : "general";
    conv.botState = { pending: { kind: "inquiry", payload: { type, subject: raw.slice(0, 120), details: raw } } };
    if (!conv.customer.name || !conv.customer.phone) return { text: `Happy to help with ${type === "general" ? "that" : type}. Please share your name and phone number so the team can get back to you.`, tool: "createInquiry", needsContact: true };
    return finalizePending();
  }

  // Catalog lookups
  if (modules.has("catalog") && matchItems.length) {
    conv.fallbackStreak = 0;
    return { text: matchItems.slice(0, 4).map((it) => `${it.name}: ${money(it.price, it.currency || org.currency)}${it.description ? ". " + it.description : ""}`).join("\n"), tool: "getProductPrice", quickReplies: modules.has("orders") ? [`Order 1 ${matchItems[0].name}`] : modules.has("appointments") ? [`Book ${matchItems[0].name}`] : undefined };
  }
  if (modules.has("catalog") && items.length && has("menu", "price", "prices", "services", "service", "plans", "plan", "courses", "programs", "what do you have", "list", "rate")) {
    conv.fallbackStreak = 0;
    const byGroup = groups.map((g) => { const its = items.filter((i) => i.groupId === String(g._id)); return its.length ? `${g.name}: ${its.slice(0, 6).map((i) => `${i.name} ${money(i.price, i.currency || org.currency)}`).join(", ")}` : ""; }).filter(Boolean);
    return { text: byGroup.join("\n") || items.slice(0, 8).map((i) => `${i.name} ${money(i.price, i.currency || org.currency)}`).join(", "), tool: "searchProducts" };
  }
  if (modules.has("staff") && staff.length && (matchStaff.length || has("doctor", "doctors", "trainer", "trainers", "teacher", "teachers", "staff", "who", "available", "availability", "specialist"))) {
    conv.fallbackStreak = 0;
    const list = (matchStaff.length ? matchStaff : staff).slice(0, 6).map((s) => { const av = s.availability?.map((a) => `${DAYS[a.day].slice(0, 3)} ${a.start}–${a.end}`).join(", "); return `${s.name}${s.title ? ", " + s.title : ""}${s.specialty ? " (" + s.specialty + ")" : ""}${s.fee ? " · fee " + money(s.fee, org.currency) : ""}${av ? " · " + av : ""}`; });
    return { text: list.join("\n"), tool: "getStaff", quickReplies: modules.has("appointments") ? [`Book appointment with ${(matchStaff[0] ?? staff[0]).name}`] : undefined };
  }
  if (has("thank", "thanks", "shukriya", "bye")) return { text: "You're welcome! Anything else I can help with?" };
  if (has("hi", "hello", "salam", "hey")) return { text: config.greeting, quickReplies: suggestions() };

  // 5. Fallback
  await UnansweredQuestion.updateOne({ orgId: org.uuid, normalized: text.slice(0, 200) }, { $set: { question: raw.slice(0, 300), lastAskedAt: new Date() }, $inc: { count: 1 } }, { upsert: true });
  conv.fallbackStreak = (conv.fallbackStreak ?? 0) + 1;
  if (conv.fallbackStreak >= 2) return escalate("two unanswered questions");
  return { text: config.fallbackMessage, quickReplies: suggestions(), tool: "fallback" };

  function suggestions() { const qs = config.quickReplies?.length ? config.quickReplies : qas.slice(0, 3).map((q) => q.question); return qs.slice(0, 4); }

  async function finalizePending(): Promise<BotReply> {
    const p = state.pending ?? (conv.botState as typeof state).pending; if (!p) return { text: config.fallbackMessage };
    conv.botState = {}; conv.fallbackStreak = 0;
    const link = (kind: string, id: string) => `/${org.uuid}/${kind}/${id}`;
    if (p.kind === "order") {
      const pl = p.payload as { cart: { itemId: string; name: string; qty: number; unitPrice: number }[]; subtotal: number; delivery: number; branchId?: string };
      const number = await nextNumber(org.uuid, "order");
      const o = await Order.create({ orgId: org.uuid, branchId: pl.branchId, conversationId: String(conv._id), number, customer: conv.customer, items: pl.cart, subtotal: pl.subtotal, deliveryCharge: pl.delivery, total: pl.subtotal + pl.delivery, currency: org.currency, status: "pending", statusHistory: [{ status: "pending", by: "bot", byName: config.name, at: new Date() }], source: "bot" });
      await logActivity({ orgId: org.uuid, actor: { type: "bot", name: config.name }, action: "order.created", targetType: "order", targetId: String(o._id), summary: `Chatbot created order #${number} for ${conv.customer.name} (${money(o.total, org.currency)})` });
      await notifyOrg(org.uuid, { type: "order.new", title: `New order #${number} · ${money(o.total, org.currency)}`, body: `${conv.customer.name} · ${pl.cart.map((c) => `${c.qty}× ${c.name}`).join(", ")}`, link: link("orders", String(o._id)) }, "newOrders");
      return { text: `Thank you ${conv.customer.name}. Your order request #${number} (${money(o.total, org.currency)}) has been received. ${org.name} will contact you on ${conv.customer.phone} to confirm.`, tool: "createOrderRequest", created: { kind: "order", id: String(o._id), number } };
    }
    if (p.kind === "appointment") {
      const pl = p.payload as { staffId?: string; staffName: string; service: string; requestedText: string };
      const number = await nextNumber(org.uuid, "appointment");
      const a = await Appointment.create({ orgId: org.uuid, branchId: conv.branchId, conversationId: String(conv._id), number, staffId: pl.staffId, staffName: pl.staffName, customer: conv.customer, service: pl.service, requestedText: pl.requestedText, status: "requested", statusHistory: [{ status: "requested", by: "bot", byName: config.name, at: new Date() }] });
      await logActivity({ orgId: org.uuid, actor: { type: "bot", name: config.name }, action: "appointment.created", targetType: "appointment", targetId: String(a._id), summary: `Chatbot created ${labels.appointment.toLowerCase()} request #${number} for ${conv.customer.name}` });
      await notifyOrg(org.uuid, { type: "appointment.new", title: `New ${labels.appointment.toLowerCase()} request #${number}`, body: `${conv.customer.name}${pl.staffName ? " with " + pl.staffName : ""} · ${pl.requestedText}`, link: link("appointments", String(a._id)) }, "appointments");
      return { text: `Thank you ${conv.customer.name}. Your ${labels.appointment.toLowerCase()} request #${number} is received. The team will confirm the time on ${conv.customer.phone}.`, tool: "requestAppointment", created: { kind: "appointment", id: String(a._id), number } };
    }
    const pl = p.payload as { type: string; subject: string; details: string };
    const number = await nextNumber(org.uuid, "inquiry");
    const i = await Inquiry.create({ orgId: org.uuid, branchId: conv.branchId, conversationId: String(conv._id), number, type: pl.type, customer: conv.customer, subject: pl.subject, details: pl.details, status: "new", statusHistory: [{ status: "new", by: "bot", byName: config.name, at: new Date() }] });
    await logActivity({ orgId: org.uuid, actor: { type: "bot", name: config.name }, action: "inquiry.created", targetType: "inquiry", targetId: String(i._id), summary: `Chatbot created ${pl.type} inquiry #${number} for ${conv.customer.name}` });
    await notifyOrg(org.uuid, { type: "inquiry.new", title: `New ${pl.type} inquiry #${number}`, body: `${conv.customer.name} · ${pl.subject}`, link: link("inquiries", String(i._id)) }, "appointments");
    return { text: `Thanks ${conv.customer.name}. Your ${pl.type} inquiry #${number} is logged. The team will reach you on ${conv.customer.phone}.`, tool: "createInquiry", created: { kind: "inquiry", id: String(i._id), number } };
  }
}
