import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { api, bearer, botSession, setupDb, signupOrg, teardown } from "./helpers.js";

beforeAll(setupDb); afterAll(teardown);

async function restaurant() {
  const o = await signupOrg({ categoryKey: "restaurant", orgName: "Kababjees" }); const base = `/v1/orgs/${o.org.uuid}`; const h = bearer(o.token);
  await api.post(`${base}/chatbot/qas`).set(h).send({ question: "Do you deliver?", answer: "Yes, we deliver within 5 km for Rs. 100.", keywords: ["deliver", "delivery"] });
  await api.post(`${base}/chatbot/qas`).set(h).send({ question: "What are your timings?", answer: "Open daily 12pm to 12am.", keywords: ["timing", "timings", "open"] });
  const g = await api.post(`${base}/catalog/groups`).set(h).send({ name: "BBQ" });
  await api.post(`${base}/catalog/items`).set(h).send({ groupId: g.body.group.id, name: "Chicken Tikka", price: 480 });
  await api.post(`${base}/catalog/items`).set(h).send({ groupId: g.body.group.id, name: "Seekh Kabab", price: 520 });
  return { o, base, h };
}

describe("chatbot: widget API, Q&A answers, orders, inbox and status flows", () => {
  it("serves config, answers from Q&A, looks up prices and records unanswered questions", async () => {
    const { o, base, h } = await restaurant();
    const cfg = await api.get(`/v1/bot/${o.org.widgetKey}/config`).set("Origin", "http://localhost:5173"); expect(cfg.status).toBe(200); expect(cfg.body.business.name).toBe("Kababjees"); expect(cfg.body.widget.quickReplies.length).toBeGreaterThan(0);
    expect((await api.get(`/v1/bot/wk_nope/config`)).status).toBe(404);
    const s = await botSession(o.org.widgetKey);
    const r1 = await s.say("do you deliver to my area?"); expect(r1.status).toBe(200); expect(r1.body.reply.text).toContain("5 km"); expect(r1.body.reply.tool).toBe("answerFromQa");
    const r2 = await s.say("how much is chicken tikka"); expect(r2.body.reply.text).toContain("480"); expect(r2.body.reply.tool).toBe("getProductPrice");
    const r3 = await s.say("what is the meaning of life"); expect(r3.body.reply.tool).toBe("fallback");
    const un = await api.get(`${base}/chatbot/unanswered`).set(h); expect(un.body.items[0].question).toContain("meaning of life");
    expect((await api.post(`/v1/bot/${o.org.widgetKey}/messages`).set("Origin", "http://localhost:5173").send({ text: "x" })).status).toBe(401); // no session
  });
  it("collects an order with contact details, notifies members, and the team moves it through statuses", async () => {
    const { o, base, h } = await restaurant();
    const s = await botSession(o.org.widgetKey);
    const r1 = await s.say("I want 2 chicken tikka and 1 seekh kabab"); expect(r1.body.reply.needsContact).toBe(true); expect(r1.body.reply.text).toContain("1,480");
    const r2 = await s.say("Ali Raza, 0300 1234567, House 12, DHA"); expect(r2.body.reply.created?.kind).toBe("order"); expect(r2.body.customer.name).toBe("Ali Raza");
    const orders = await api.get(`${base}/orders`).set(h); expect(orders.body.items).toHaveLength(1); const order = orders.body.items[0]; expect(order.total).toBe(1480); expect(order.status).toBe("pending");
    const notif = await api.get("/v1/me/notifications").set(h); expect(notif.body.items.some((n: { type: string }) => n.type === "order.new")).toBe(true);
    expect((await api.patch(`${base}/orders/${order.id}/status`).set(h).send({ status: "completed" })).status).toBe(400); // invalid transition
    expect((await api.patch(`${base}/orders/${order.id}/status`).set(h).send({ status: "confirmed" })).status).toBe(200);
    const detail = await api.get(`${base}/orders/${order.id}`).set(h); expect(detail.body.order.statusHistory).toHaveLength(2); expect(detail.body.messages.some((m: { from: string; text: string }) => m.from === "system" && m.text.includes("confirmed"))).toBe(true);
    const poll = await api.get(`/v1/bot/${o.org.widgetKey}/messages`).set("Origin", "http://localhost:5173").set(bearer(s.token)); expect(poll.body.messages.some((m: { text: string }) => m.text.includes("confirmed"))).toBe(true); // customer sees it
    expect((await api.patch(`${base}/orders/${order.id}/status`).set(h).send({ status: "completed" })).status).toBe(200);
  });
  it("hands over to a human, lets staff reply, and the widget receives the reply", async () => {
    const { o, base, h } = await restaurant();
    const s = await botSession(o.org.widgetKey);
    const r = await s.say("I want to talk to a person"); expect(r.body.reply.handover).toBe(true); expect(r.body.status).toBe("needs_human");
    const list = await api.get(`${base}/conversations?status=needs_human`).set(h); expect(list.body.items).toHaveLength(1);
    const conv = list.body.items[0];
    expect((await api.post(`${base}/conversations/${conv.id}/takeover`).set(h)).body.conversation.status).toBe("human");
    const reply = await api.post(`${base}/conversations/${conv.id}/messages`).set(h).send({ text: "Hi, this is Imran. How can I help?" }); expect(reply.status).toBe(201);
    const poll = await api.get(`/v1/bot/${o.org.widgetKey}/messages`).set("Origin", "http://localhost:5173").set(bearer(s.token)); expect(poll.body.messages.at(-1).from).toBe("staff");
    const r2 = await s.say("My order was late"); expect(r2.body.reply).toBeNull(); // bot silent while human
    const n = await api.get("/v1/me/notifications").set(h); expect(n.body.items.some((x: { type: string }) => x.type === "message.new")).toBe(true);
    expect((await api.post(`${base}/conversations/${conv.id}/close`).set(h)).body.conversation.status).toBe("closed");
    expect((await s.say("hello?")).status).toBe(409);
    const detail = await api.get(`${base}/conversations/${conv.id}`).set(h); expect(detail.body.messages.filter((m: { from: string }) => m.from === "customer")).toHaveLength(2);
  });
  it("escalates after two unanswered questions", async () => {
    const { o } = await restaurant(); const s = await botSession(o.org.widgetKey);
    await s.say("zxq blorp"); const r = await s.say("florp zzz"); expect(r.body.reply.handover).toBe(true);
  });
  it("creates appointment requests for a hospital and inquiries for a school", async () => {
    const h = await signupOrg({ categoryKey: "hospital" }); const hb = `/v1/orgs/${h.org.uuid}`;
    await api.post(`${hb}/staff`).set(bearer(h.token)).send({ name: "Dr. Ahmed Khan", title: "Cardiologist", fee: 3000, availability: [{ day: 1, start: "09:00", end: "13:00" }] });
    const s = await botSession(h.org.widgetKey);
    const r0 = await s.say("which doctors do you have"); expect(r0.body.reply.text).toContain("Ahmed Khan");
    const r1 = await s.say("book an appointment with Dr Ahmed on Monday 10am"); expect(r1.body.reply.needsContact).toBe(true);
    const r2 = await s.say("Sana Ahmed, 0321 9876543"); expect(r2.body.reply.created?.kind).toBe("appointment");
    const appts = await api.get(`${hb}/appointments`).set(bearer(h.token)); expect(appts.body.items[0].staffName).toBe("Dr. Ahmed Khan"); expect(appts.body.items[0].requestedText).toContain("monday");
    expect((await api.patch(`${hb}/appointments/${appts.body.items[0].id}/status`).set(bearer(h.token)).send({ status: "confirmed", note: "Monday 10:30" })).status).toBe(200);
    const sc = await signupOrg({ categoryKey: "school" }); const s2 = await botSession(sc.org.widgetKey);
    await s2.say("I want admission for my son in grade 5"); const r3 = await s2.say("Usman Tariq, 0333 5556667"); expect(r3.body.reply.created?.kind).toBe("inquiry");
    const inq = await api.get(`/v1/orgs/${sc.org.uuid}/inquiries`).set(bearer(sc.token)); expect(inq.body.items[0].type).toBe("admission");
  });
  it("resumes a session and refuses other organizations' tokens", async () => {
    const a = await restaurant(); const b = await restaurant();
    const s = await botSession(a.o.org.widgetKey); await s.say("timings?");
    const resume = await api.post(`/v1/bot/${a.o.org.widgetKey}/sessions`).set("Origin", "http://localhost:5173").send({ sessionToken: s.token }); expect(resume.status).toBe(200); expect(resume.body.messages.length).toBeGreaterThanOrEqual(3);
    expect((await api.get(`/v1/bot/${b.o.org.widgetKey}/messages`).set("Origin", "http://localhost:5173").set(bearer(s.token))).status).toBe(401);
    expect((await api.get(`${b.base}/conversations`).set(b.h)).body.items).toHaveLength(0);
  });
});
