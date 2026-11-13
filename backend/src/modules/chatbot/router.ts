import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { wrap } from "../../lib/async.js";
import { notFound } from "../../lib/http-error.js";
import { toJSONList } from "../../lib/serialize.js";
import { validate } from "../../lib/validate.js";
import { Branch, ChatbotConfig, ChatbotQa, UnansweredQuestion } from "../../models/index.js";
import { logActivity, userActor } from "../../services/activity.js";

export const chatbotRouter = Router({ mergeParams: true });

async function getConfig(orgId: string) { return (await ChatbotConfig.findOne({ orgId })) ?? (await ChatbotConfig.create({ orgId })); }

chatbotRouter.get("/", wrap(async (req, res) => res.json({ config: (await getConfig(req.org!.uuid)).toJSON() })));
chatbotRouter.patch("/", validate({ body: z.object({
  name: z.string().trim().min(1).max(60).optional(), greeting: z.string().max(500).optional(), fallbackMessage: z.string().max(500).optional(), collectContact: z.boolean().optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(), position: z.enum(["bottom-right", "bottom-left"]).optional(), buttonLabel: z.string().max(40).optional(),
  quickReplies: z.array(z.string().max(80)).max(6).optional(), handoverKeywords: z.array(z.string().max(40)).max(30).optional(), isEnabled: z.boolean().optional(),
}) }), wrap(async (req, res) => {
  const c = await getConfig(req.org!.uuid); Object.assign(c, req.body); await c.save();
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "chatbot.config_updated", targetType: "chatbot", targetId: String(c._id), summary: `${req.user!.name || req.user!.email} updated chatbot settings` });
  res.json({ config: c.toJSON() });
}));

chatbotRouter.get("/embed", wrap(async (req, res) => {
  const snippet = `<script src="${env.urls.api.replace(/:4000$/, ":5173")}/widget.js" data-business="${req.org!.widgetKey}" data-api="${env.urls.api}" async></script>`;
  res.json({ widgetKey: req.org!.widgetKey, apiUrl: env.urls.api, snippet, allowedOrigins: req.org!.allowedOrigins, playgroundUrl: `${env.urls.api.replace(/:4000$/, ":5173")}/?business=${req.org!.widgetKey}&api=${encodeURIComponent(env.urls.api)}` });
}));

// ----- Q&A -----
const qaBody = z.object({ question: z.string().trim().min(3).max(300), answer: z.string().trim().min(1).max(2000), keywords: z.array(z.string().trim().min(1).max(40)).max(20).optional(), branchId: z.string().optional().or(z.literal("")), isActive: z.boolean().optional() });

chatbotRouter.get("/qas", validate({ query: z.object({ q: z.string().max(100).optional() }) }), wrap(async (req, res) => {
  const { q } = req.query as { q?: string };
  const filter: Record<string, unknown> = { orgId: req.org!.uuid, ...(q ? { $or: [{ question: { $regex: q, $options: "i" } }, { answer: { $regex: q, $options: "i" } }] } : {}) };
  res.json({ items: toJSONList(await ChatbotQa.find(filter).sort({ createdAt: -1 }).lean()) });
}));
chatbotRouter.post("/qas", validate({ body: qaBody }), wrap(async (req, res) => {
  if (req.body.branchId && !(await Branch.exists({ _id: req.body.branchId, orgId: req.org!.uuid }))) return res.status(400).json({ error: "Unknown branch" });
  const qa = await ChatbotQa.create({ ...req.body, orgId: req.org!.uuid });
  await UnansweredQuestion.updateMany({ orgId: req.org!.uuid, normalized: qa.question.toLowerCase() }, { $set: { resolvedQaId: String(qa._id) } });
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "chatbot.qa_created", targetType: "qa", targetId: String(qa._id), summary: `${req.user!.name || req.user!.email} added Q&A: ${qa.question}` });
  res.status(201).json({ qa: qa.toJSON() });
}));
chatbotRouter.patch("/qas/:id", validate({ body: qaBody.partial() }), wrap(async (req, res) => {
  const qa = await ChatbotQa.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!qa) throw notFound("Q&A not found");
  Object.assign(qa, req.body); await qa.save();
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "chatbot.qa_updated", targetType: "qa", targetId: String(qa._id), summary: `${req.user!.name || req.user!.email} edited Q&A: ${qa.question}` });
  res.json({ qa: qa.toJSON() });
}));
chatbotRouter.delete("/qas/:id", wrap(async (req, res) => {
  const qa = await ChatbotQa.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!qa) throw notFound("Q&A not found");
  await qa.deleteOne();
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "chatbot.qa_deleted", targetType: "qa", targetId: String(qa._id), summary: `${req.user!.name || req.user!.email} deleted Q&A: ${qa.question}` });
  res.json({ ok: true });
}));
chatbotRouter.get("/unanswered", wrap(async (req, res) => res.json({ items: toJSONList(await UnansweredQuestion.find({ orgId: req.org!.uuid, resolvedQaId: { $exists: false } }).sort({ count: -1, lastAskedAt: -1 }).limit(50).lean()) })));
chatbotRouter.delete("/unanswered/:id", wrap(async (req, res) => { await UnansweredQuestion.deleteOne({ _id: req.params.id, orgId: req.org!.uuid }); res.json({ ok: true }); }));
