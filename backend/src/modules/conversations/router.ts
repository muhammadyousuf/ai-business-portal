import { Router } from "express";
import { z } from "zod";
import { wrap } from "../../lib/async.js";
import { badRequest, notFound } from "../../lib/http-error.js";
import { pageQuery, paged, skip } from "../../lib/pagination.js";
import { toJSONList } from "../../lib/serialize.js";
import { validate } from "../../lib/validate.js";
import { Appointment, Conversation, Inquiry, Message, Order, User } from "../../models/index.js";
import { logActivity, userActor } from "../../services/activity.js";

export const conversationsRouter = Router({ mergeParams: true });

conversationsRouter.get("/", validate({ query: pageQuery.extend({ status: z.enum(["bot", "needs_human", "human", "closed", "open"]).optional(), branchId: z.string().optional(), q: z.string().max(100).optional() }) }), wrap(async (req, res) => {
  const q = req.query as unknown as z.infer<typeof pageQuery> & { status?: string; branchId?: string; q?: string };
  const filter: Record<string, unknown> = { orgId: req.org!.uuid };
  if (q.status === "open") filter.status = { $ne: "closed" }; else if (q.status) filter.status = q.status;
  if (q.branchId) filter.branchId = q.branchId;
  if (q.q) filter.$or = [{ "customer.name": { $regex: q.q, $options: "i" } }, { "customer.phone": { $regex: q.q, $options: "i" } }, { lastMessagePreview: { $regex: q.q, $options: "i" } }];
  const [items, total, counts] = await Promise.all([Conversation.find(filter).sort({ lastMessageAt: -1 }).skip(skip(q)).limit(q.limit).lean(), Conversation.countDocuments(filter), Conversation.aggregate([{ $match: { orgId: req.org!.uuid } }, { $group: { _id: "$status", n: { $sum: 1 } } }])]);
  res.json({ ...paged(toJSONList(items), total, q), counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) });
}));

conversationsRouter.get("/:id", wrap(async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!conv) throw notFound("Conversation not found");
  const [messages, order, appointment, inquiry, assignee] = await Promise.all([
    Message.find({ conversationId: String(conv._id) }).sort({ createdAt: 1 }).lean(), Order.find({ conversationId: String(conv._id) }).lean(), Appointment.find({ conversationId: String(conv._id) }).lean(), Inquiry.find({ conversationId: String(conv._id) }).lean(),
    conv.assignedTo ? User.findById(conv.assignedTo, { name: 1, email: 1 }).lean() : null,
  ]);
  if (conv.unreadForStaff) { conv.unreadForStaff = 0; await conv.save(); }
  res.json({ conversation: { ...conv.toJSON(), assignee: assignee ? { id: String(assignee._id), name: assignee.name || assignee.email } : null }, messages: toJSONList(messages), orders: toJSONList(order), appointments: toJSONList(appointment), inquiries: toJSONList(inquiry) });
}));

// Staff reply: switches the conversation to human if the bot was handling it.
conversationsRouter.post("/:id/messages", validate({ body: z.object({ text: z.string().trim().min(1).max(2000) }) }), wrap(async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!conv) throw notFound("Conversation not found");
  if (conv.status === "closed") throw badRequest("Reopen the conversation to reply");
  const msg = await Message.create({ orgId: req.org!.uuid, conversationId: String(conv._id), from: "staff", text: req.body.text, authorUserId: String(req.user!._id), authorName: req.user!.name || req.user!.email });
  if (conv.status !== "human") { conv.status = "human"; conv.assignedTo = String(req.user!._id); }
  conv.lastMessageAt = new Date(); conv.lastMessagePreview = req.body.text.slice(0, 140); conv.unreadForStaff = 0; await conv.save();
  res.status(201).json({ message: msg.toJSON(), conversation: conv.toJSON() });
}));

conversationsRouter.post("/:id/takeover", wrap(async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!conv) throw notFound("Conversation not found");
  if (conv.status === "closed") throw badRequest("Conversation is closed");
  conv.status = "human"; conv.assignedTo = String(req.user!._id); await conv.save();
  await Message.create({ orgId: req.org!.uuid, conversationId: String(conv._id), from: "system", text: `${req.user!.name || "A team member"} joined the conversation.` });
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "conversation.takeover", targetType: "conversation", targetId: String(conv._id), summary: `${req.user!.name || req.user!.email} took over a conversation from the chatbot` });
  res.json({ conversation: conv.toJSON() });
}));

conversationsRouter.post("/:id/handback", wrap(async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!conv) throw notFound("Conversation not found");
  conv.status = "bot"; conv.assignedTo = undefined; conv.fallbackStreak = 0; await conv.save();
  await Message.create({ orgId: req.org!.uuid, conversationId: String(conv._id), from: "system", text: "The assistant is back. Ask me anything." });
  res.json({ conversation: conv.toJSON() });
}));

conversationsRouter.post("/:id/close", wrap(async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!conv) throw notFound("Conversation not found");
  conv.status = "closed"; conv.closedAt = new Date(); conv.closedBy = String(req.user!._id); await conv.save();
  await Message.create({ orgId: req.org!.uuid, conversationId: String(conv._id), from: "system", text: "This conversation was closed. Start a new chat if you need anything else." });
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "conversation.closed", targetType: "conversation", targetId: String(conv._id), summary: `${req.user!.name || req.user!.email} closed a conversation` });
  res.json({ conversation: conv.toJSON() });
}));

conversationsRouter.post("/:id/reopen", wrap(async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!conv) throw notFound("Conversation not found");
  conv.status = "human"; conv.assignedTo = String(req.user!._id); conv.closedAt = undefined; await conv.save();
  res.json({ conversation: conv.toJSON() });
}));

conversationsRouter.patch("/:id/customer", validate({ body: z.object({ name: z.string().max(80).optional(), phone: z.string().max(32).optional(), email: z.string().email().max(254).optional().or(z.literal("")), address: z.string().max(300).optional() }) }), wrap(async (req, res) => {
  const conv = await Conversation.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!conv) throw notFound("Conversation not found");
  conv.customer = { ...(conv.customer as object), ...req.body } as typeof conv.customer; await conv.save(); res.json({ conversation: conv.toJSON() });
}));
