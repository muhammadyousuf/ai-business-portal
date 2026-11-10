import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { HttpError } from "../../lib/http-error.js";
import { botCors } from "../../middleware/cors.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { findBusinessByKey } from "./fixtures.js";
import { respond, type SessionState } from "./responder.js";

// Public, unauthenticated-by-login API used by the embeddable widget.
// Identity: the business's public widget key (URL) + a per-visitor session token (Bearer).
// Origin: must match the business's registered website origins (see middleware/cors.ts).
export const botRouter = Router({ mergeParams: true });
const sessions = new Map<string, SessionState>();

botRouter.use("/:businessKey", botCors, rateLimit(60, 60_000), (req, _res, next) => {
  const b = findBusinessByKey(req.params.businessKey);
  if (!b) return next(new HttpError(404, "Unknown widget key"));
  res_locals(req).business = b;
  next();
});
function res_locals(req: import("express").Request) { return (req as unknown as { locals: Record<string, unknown> }).locals ??= {}; }
const biz = (req: import("express").Request) => res_locals(req).business as ReturnType<typeof findBusinessByKey> & object;

// What the widget needs to render before any message is sent.
botRouter.get("/:businessKey/config", (req, res) => {
  const b = biz(req);
  res.json({
    business: { name: b.name, logoText: b.logoText, brand: b.brand, locale: b.locale },
    widget: { greeting: b.greeting, quickReplies: b.quickReplies, position: "bottom-right", buttonLabel: "Chat with us", poweredBy: true, humanConfirms: true },
  });
});

// Start (or resume) a visitor session. The token is stored by the widget in localStorage.
botRouter.post("/:businessKey/sessions", (req, res) => {
  const b = biz(req);
  const body = z.object({ sessionId: z.string().optional(), pageUrl: z.string().optional(), referrer: z.string().optional() }).parse(req.body ?? {});
  const existing = body.sessionId ? sessions.get(body.sessionId) : undefined;
  if (existing && existing.businessId === b.id) return res.json({ sessionId: existing.id, token: `vt_${existing.id}`, messages: existing.history });
  const s: SessionState = { id: nanoid(12), businessId: b.id, stage: "idle", cart: [], history: [{ from: "ai", text: b.greeting, at: new Date().toISOString() }] };
  sessions.set(s.id, s);
  res.status(201).json({ sessionId: s.id, token: `vt_${s.id}`, messages: s.history });
});

// One customer message in, one assistant reply out. Streaming (SSE) comes later on /stream.
botRouter.post("/:businessKey/messages", async (req, res, next) => {
  try {
    const b = biz(req);
    const body = z.object({ sessionId: z.string(), text: z.string().min(1).max(2000) }).parse(req.body);
    const token = (req.header("authorization") ?? "").replace("Bearer ", "");
    const s = sessions.get(body.sessionId);
    if (!s || s.businessId !== b.id || token !== `vt_${s.id}`) throw new HttpError(401, "Invalid session");
    s.history.push({ from: "customer", text: body.text, at: new Date().toISOString() });
    const reply = await respond(b, s, body.text);
    s.history.push({ from: "ai", text: reply.text, tool: reply.tool, at: new Date().toISOString() });
    if (reply.order) s.history.push({ from: "system", text: `Order ${reply.order.number} created · owner notified by WhatsApp + email`, at: new Date().toISOString() });
    res.json({ reply, messages: s.history.slice(-3) });
  } catch (e) { next(e); }
});

botRouter.get("/:businessKey/sessions/:id/messages", (req, res, next) => {
  const s = sessions.get(req.params.id);
  if (!s || s.businessId !== biz(req).id) return next(new HttpError(404, "Unknown session"));
  res.json({ messages: s.history });
});
