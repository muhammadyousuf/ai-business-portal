import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { wrap } from "../../lib/async.js";
import { notFound, unauthorized } from "../../lib/http-error.js";
import { randomToken, sha256 } from "../../lib/tokens.js";
import { toJSONList } from "../../lib/serialize.js";
import { validate } from "../../lib/validate.js";
import { botCors } from "../../middleware/cors.js";
import { botLimiter } from "../../middleware/rate-limit.js";
import { BotSession, Branch, Category, ChatbotConfig, ChatbotQa, Conversation, Message, Organization } from "../../models/index.js";
import { notifyOrg } from "../../services/notifications.js";
import { respond } from "../../services/bot/responder.js";

// Public widget API. Identity = widget key (organization) + visitor session token (conversation).
export const botRouter = Router({ mergeParams: true });

botRouter.use("/:widgetKey", botCors, botLimiter, wrap(async (req, _res, next) => {
  const org = await Organization.findOne({ widgetKey: req.params.widgetKey, status: "active" });
  if (!org) throw notFound("Unknown widget key");
  req.org = org; req.category = (await Category.findOne({ key: org.categoryKey })) ?? undefined;
  next();
}));

async function configFor(orgId: string) { return (await ChatbotConfig.findOne({ orgId })) ?? (await ChatbotConfig.create({ orgId })); }

botRouter.get("/:widgetKey/config", wrap(async (req, res) => {
  const cfg = await configFor(req.org!.uuid);
  const top = cfg.quickReplies.length ? cfg.quickReplies : (await ChatbotQa.find({ orgId: req.org!.uuid, isActive: true }).sort({ hits: -1, createdAt: 1 }).limit(3).lean()).map((q) => q.question);
  const branches = await Branch.find({ orgId: req.org!.uuid, isActive: true }, { name: 1 }).lean();
  res.json({ business: { name: req.org!.name, logoText: req.org!.name.slice(0, 1).toUpperCase(), logoUrl: req.org!.logoUrl, brand: cfg.brandColor, locale: "en" }, widget: { enabled: cfg.isEnabled, greeting: cfg.greeting, quickReplies: top, position: cfg.position, buttonLabel: cfg.buttonLabel, poweredBy: cfg.poweredBy, collectContact: cfg.collectContact, humanConfirms: true, assistantName: cfg.name, branches: branches.map((b) => ({ id: String(b._id), name: b.name })) } });
}));

async function sessionFromReq(req: import("express").Request) {
  const token = (req.header("authorization") ?? "").replace("Bearer ", "");
  if (!token) throw unauthorized("Missing session token");
  const s = await BotSession.findOne({ tokenHash: sha256(token), orgId: req.org!.uuid });
  if (!s) throw unauthorized("Invalid session");
  const conv = await Conversation.findOne({ _id: s.conversationId, orgId: req.org!.uuid });
  if (!conv) throw unauthorized("Conversation not found");
  s.lastSeenAt = new Date(); await s.save();
  return { session: s, conv };
}

botRouter.post("/:widgetKey/sessions", validate({ body: z.object({ visitorId: z.string().max(80).optional(), sessionToken: z.string().max(120).optional(), pageUrl: z.string().max(500).optional(), referrer: z.string().max(500).optional(), branchId: z.string().max(40).optional() }) }), wrap(async (req, res) => {
  const cfg = await configFor(req.org!.uuid);
  if (!cfg.isEnabled) return res.status(403).json({ error: "Chat is currently disabled", code: "disabled" });
  // Resume an existing, still-open conversation.
  if (req.body.sessionToken) {
    const s = await BotSession.findOne({ tokenHash: sha256(req.body.sessionToken), orgId: req.org!.uuid });
    const conv = s ? await Conversation.findOne({ _id: s.conversationId, orgId: req.org!.uuid, status: { $ne: "closed" } }) : null;
    if (s && conv) { s.lastSeenAt = new Date(); await s.save(); const msgs = await Message.find({ conversationId: String(conv._id) }).sort({ createdAt: 1 }).lean(); return res.json({ sessionToken: req.body.sessionToken, conversationId: String(conv._id), status: conv.status, customer: conv.customer, messages: toJSONList(msgs) }); }
  }
  const visitorId = req.body.visitorId || randomToken(8);
  const conv = await Conversation.create({ orgId: req.org!.uuid, branchId: req.body.branchId || undefined, visitorId, pageUrl: req.body.pageUrl ?? "", lastMessagePreview: cfg.greeting });
  const greeting = await Message.create({ orgId: req.org!.uuid, conversationId: String(conv._id), from: "bot", text: cfg.greeting, authorName: cfg.name });
  const token = randomToken();
  await BotSession.create({ orgId: req.org!.uuid, conversationId: String(conv._id), visitorId, tokenHash: sha256(token) });
  res.status(201).json({ sessionToken: token, conversationId: String(conv._id), status: conv.status, customer: conv.customer, messages: [greeting.toJSON()] });
}));

botRouter.post("/:widgetKey/messages", validate({ body: z.object({ text: z.string().trim().min(1).max(2000) }) }), wrap(async (req, res) => {
  const { conv } = await sessionFromReq(req);
  if (conv.status === "closed") return res.status(409).json({ error: "This conversation is closed. Start a new chat.", code: "closed" });
  const cfg = await configFor(req.org!.uuid);
  const customerMsg = await Message.create({ orgId: req.org!.uuid, conversationId: String(conv._id), from: "customer", text: req.body.text });
  conv.lastMessageAt = new Date(); conv.lastMessagePreview = req.body.text.slice(0, 140); conv.unreadForStaff += 1;
  const out = [customerMsg.toJSON()];
  let reply = null as Awaited<ReturnType<typeof respond>> | null;
  if (conv.status === "human") {
    await notifyOrg(req.org!.uuid, { type: "message.new", title: `New message from ${conv.customer.name || "a customer"}`, body: req.body.text.slice(0, 140), link: `/${req.org!.uuid}/inbox/${conv._id}` }, "newMessages", undefined);
  } else {
    reply = await respond(req.org!, req.category, cfg, conv as never, req.body.text);
    const botMsg = await Message.create({ orgId: req.org!.uuid, conversationId: String(conv._id), from: "bot", text: reply.text, authorName: cfg.name, meta: { tool: reply.tool, handover: reply.handover, created: reply.created } });
    out.push(botMsg.toJSON());
    conv.lastMessagePreview = reply.text.slice(0, 140);
    if (reply.created) { const sys = await Message.create({ orgId: req.org!.uuid, conversationId: String(conv._id), from: "system", text: `${reply.created.kind.charAt(0).toUpperCase() + reply.created.kind.slice(1)} #${reply.created.number} created · team notified`, meta: reply.created }); out.push(sys.toJSON()); }
  }
  conv.markModified("botState"); await conv.save();
  res.json({ reply, messages: out, status: conv.status, customer: conv.customer });
}));

botRouter.get("/:widgetKey/messages", validate({ query: z.object({ after: z.string().optional() }) }), wrap(async (req, res) => {
  const { conv } = await sessionFromReq(req);
  const after = (req.query as { after?: string }).after;
  const filter: Record<string, unknown> = { conversationId: String(conv._id), ...(after ? { createdAt: { $gt: new Date(after) } } : {}) };
  const msgs = await Message.find(filter).sort({ createdAt: 1 }).limit(100).lean();
  res.json({ messages: toJSONList(msgs), status: conv.status, customer: conv.customer });
}));

botRouter.post("/:widgetKey/contact", validate({ body: z.object({ name: z.string().trim().min(1).max(80), phone: z.string().trim().min(6).max(32), email: z.string().email().max(254).optional().or(z.literal("")), address: z.string().max(300).optional() }) }), wrap(async (req, res) => {
  const { conv } = await sessionFromReq(req);
  conv.customer = { ...(conv.customer as object), ...req.body } as typeof conv.customer; await conv.save();
  res.json({ customer: conv.customer });
}));

export const botPublicUrl = () => env.urls.api;
