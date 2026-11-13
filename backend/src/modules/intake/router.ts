import { Router } from "express";
import { z } from "zod";
import { wrap } from "../../lib/async.js";
import { badRequest, notFound } from "../../lib/http-error.js";
import { pageQuery, paged, skip } from "../../lib/pagination.js";
import { toJSONList } from "../../lib/serialize.js";
import { validate } from "../../lib/validate.js";
import { requireModule } from "../../middleware/org.js";
import { APPOINTMENT_STATUSES, Appointment, INQUIRY_STATUSES, Inquiry, Message, ORDER_STATUSES, Order, StaffProfile, Conversation } from "../../models/index.js";
import { nextNumber } from "../../services/counters.js";
import { applyStatus } from "../../services/intake.js";
import { logActivity, userActor } from "../../services/activity.js";

const ORDER_FLOW: Record<string, string[]> = { pending: ["confirmed", "cancelled"], confirmed: ["preparing", "ready", "completed", "cancelled"], preparing: ["ready", "completed", "cancelled"], ready: ["completed", "cancelled"], completed: [], cancelled: [] };
const APPT_FLOW: Record<string, string[]> = { requested: ["confirmed", "cancelled"], confirmed: ["completed", "cancelled", "no_show"], completed: [], cancelled: [], no_show: [] };
const INQ_FLOW: Record<string, string[]> = { new: ["in_progress", "resolved", "closed"], in_progress: ["resolved", "closed"], resolved: ["closed"], closed: [] };

function list(Model: typeof Order | typeof Appointment | typeof Inquiry, statuses: readonly string[]) {
  return [validate({ query: pageQuery.extend({ status: z.enum(statuses as [string, ...string[]]).optional(), branchId: z.string().optional(), q: z.string().max(100).optional() }) }), wrap(async (req: import("express").Request, res: import("express").Response) => {
    const q = req.query as unknown as z.infer<typeof pageQuery> & { status?: string; branchId?: string; q?: string };
    const filter: Record<string, unknown> = { orgId: req.org!.uuid, ...(q.status ? { status: q.status } : {}), ...(q.branchId ? { branchId: q.branchId } : {}) };
    if (q.q) filter.$or = [{ "customer.name": { $regex: q.q, $options: "i" } }, { "customer.phone": { $regex: q.q, $options: "i" } }, ...(Number.isFinite(Number(q.q)) ? [{ number: Number(q.q) }] : [])];
    const M = Model as typeof Order;
    const [items, total, counts] = await Promise.all([M.find(filter).sort({ createdAt: -1 }).skip(skip(q)).limit(q.limit).lean(), M.countDocuments(filter), M.aggregate([{ $match: { orgId: req.org!.uuid } }, { $group: { _id: "$status", n: { $sum: 1 } } }])]);
    res.json({ ...paged(toJSONList(items), total, q), counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) });
  })] as const;
}
function detail(Model: typeof Order | typeof Appointment | typeof Inquiry, label: string) {
  return wrap(async (req, res) => {
    const d = await (Model as typeof Order).findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!d) throw notFound(`${label} not found`);
    const messages = d.conversationId ? await Message.find({ conversationId: d.conversationId }).sort({ createdAt: 1 }).lean() : [];
    res.json({ [label.toLowerCase()]: d.toJSON(), messages: toJSONList(messages) });
  });
}
function status(Model: typeof Order | typeof Appointment | typeof Inquiry, kind: "order" | "appointment" | "inquiry", flow: Record<string, string[]>, statuses: readonly string[], label: string) {
  return [validate({ body: z.object({ status: z.enum(statuses as [string, ...string[]]), note: z.string().max(500).optional() }) }), wrap(async (req: import("express").Request, res: import("express").Response) => {
    const d = await (Model as typeof Order).findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!d) throw notFound(`${label} not found`);
    if (!flow[d.status]?.includes(req.body.status)) throw badRequest(`Cannot move ${label.toLowerCase()} from ${d.status} to ${req.body.status}`);
    await applyStatus(kind, d, req.body.status, userActor(req.user!), req.body.note ?? "");
    res.json({ [kind]: d.toJSON() });
  })] as const;
}

export const ordersRouter = Router({ mergeParams: true });
ordersRouter.use(requireModule("orders"));
ordersRouter.get("/", ...list(Order, ORDER_STATUSES));
ordersRouter.get("/:id", detail(Order, "Order"));
ordersRouter.patch("/:id/status", ...status(Order, "order", ORDER_FLOW, ORDER_STATUSES, "Order"));
// Manual order (phone/walk-in)
ordersRouter.post("/", validate({ body: z.object({ customer: z.object({ name: z.string().min(1).max(80), phone: z.string().min(6).max(32), address: z.string().max(300).optional() }), items: z.array(z.object({ name: z.string().min(1).max(160), qty: z.number().int().min(1), unitPrice: z.number().min(0), itemId: z.string().optional(), options: z.string().max(200).optional() })).min(1), deliveryCharge: z.number().min(0).default(0), notes: z.string().max(500).optional(), branchId: z.string().optional() }) }), wrap(async (req, res) => {
  const b = req.body; const subtotal = b.items.reduce((t: number, i: { qty: number; unitPrice: number }) => t + i.qty * i.unitPrice, 0);
  const number = await nextNumber(req.org!.uuid, "order");
  const o = await Order.create({ orgId: req.org!.uuid, branchId: b.branchId, number, customer: b.customer, items: b.items, subtotal, deliveryCharge: b.deliveryCharge, total: subtotal + b.deliveryCharge, currency: req.org!.currency, notes: b.notes ?? "", status: "confirmed", source: "manual", statusHistory: [{ status: "confirmed", by: String(req.user!._id), byName: req.user!.name, at: new Date() }] });
  await logActivity({ orgId: req.org!.uuid, actor: userActor(req.user!), action: "order.created", targetType: "order", targetId: String(o._id), summary: `${req.user!.name || req.user!.email} created manual order #${number}` });
  res.status(201).json({ order: o.toJSON() });
}));

export const appointmentsRouter = Router({ mergeParams: true });
appointmentsRouter.use(requireModule("appointments"));
appointmentsRouter.get("/", ...list(Appointment, APPOINTMENT_STATUSES));
appointmentsRouter.get("/:id", detail(Appointment, "Appointment"));
appointmentsRouter.patch("/:id/status", ...status(Appointment, "appointment", APPT_FLOW, APPOINTMENT_STATUSES, "Appointment"));
appointmentsRouter.patch("/:id", validate({ body: z.object({ staffId: z.string().optional().or(z.literal("")), requestedAt: z.string().datetime().optional(), service: z.string().max(160).optional(), notes: z.string().max(500).optional() }) }), wrap(async (req, res) => {
  const a = await Appointment.findOne({ _id: req.params.id, orgId: req.org!.uuid }); if (!a) throw notFound("Appointment not found");
  if (req.body.staffId) { const s = await StaffProfile.findOne({ _id: req.body.staffId, orgId: req.org!.uuid }); if (!s) throw badRequest("Unknown staff"); a.staffId = String(s._id); a.staffName = s.name; }
  if (req.body.requestedAt) a.requestedAt = new Date(req.body.requestedAt);
  if (req.body.service !== undefined) a.service = req.body.service; if (req.body.notes !== undefined) a.notes = req.body.notes;
  await a.save(); res.json({ appointment: a.toJSON() });
}));

export const inquiriesRouter = Router({ mergeParams: true });
inquiriesRouter.use(requireModule("inquiries"));
inquiriesRouter.get("/", ...list(Inquiry, INQUIRY_STATUSES));
inquiriesRouter.get("/:id", detail(Inquiry, "Inquiry"));
inquiriesRouter.patch("/:id/status", ...status(Inquiry, "inquiry", INQ_FLOW, INQUIRY_STATUSES, "Inquiry"));

export { Conversation };
