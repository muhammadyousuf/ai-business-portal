import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { api, bearer, botSession, createAdmin, PNG, setupDb, signupOrg, teardown } from "./helpers.js";

beforeAll(setupDb); afterAll(teardown);

describe("admin portal API", () => {
  it("rejects non-admin accounts and accepts admins", async () => {
    const o = await signupOrg(); expect((await api.get("/v1/admin/me").set(bearer(o.token))).status).toBe(403);
    const a = await createAdmin(); const me = await api.get("/v1/admin/me").set(bearer(a.token)); expect(me.status).toBe(200); expect(me.body.admin.email).toBe(a.email);
    expect((await api.get("/v1/me/organizations").set(bearer(a.token))).status).toBe(200); // admin can hit /me but has no orgs
  });
  it("updates admin profile, avatar and preferences", async () => {
    const a = await createAdmin();
    expect((await api.patch("/v1/admin/me").set(bearer(a.token)).send({ name: "Yousuf" })).body.admin.name).toBe("Yousuf");
    expect((await api.post("/v1/admin/me/avatar").set(bearer(a.token)).attach("file", PNG, "a.png")).status).toBe(200);
    expect((await api.patch("/v1/admin/me/notification-preferences").set(bearer(a.token)).send({ members: false })).body.notificationPrefs.members).toBe(false);
  });
  it("manages categories dynamically", async () => {
    const a = await createAdmin();
    const list = await api.get("/v1/admin/categories").set(bearer(a.token)); expect(list.body.items.length).toBeGreaterThanOrEqual(5);
    const c = await api.post("/v1/admin/categories").set(bearer(a.token)).send({ key: "pharmacy", name: "Pharmacy", modules: ["branches", "catalog", "qa", "inbox", "orders"], labels: { catalogGroup: "Section", catalogItem: "Product" } }); expect(c.status).toBe(201);
    expect((await api.post("/v1/admin/categories").set(bearer(a.token)).send({ key: "pharmacy", name: "Dup", modules: ["qa"] })).status).toBe(409);
    expect((await api.post("/v1/admin/categories").set(bearer(a.token)).send({ key: "x", name: "Bad", modules: ["nope"] })).status).toBe(400);
    const pub = await api.get("/v1/auth/categories"); expect(pub.body.items.some((x: { key: string }) => x.key === "pharmacy")).toBe(true);
    const o = await signupOrg({ categoryKey: "pharmacy" }); expect((await api.get(`/v1/orgs/${o.org.uuid}/orders`).set(bearer(o.token))).status).toBe(200);
    expect((await api.patch("/v1/admin/categories/pharmacy").set(bearer(a.token)).send({ isActive: false })).status).toBe(200);
    expect((await api.get("/v1/auth/categories")).body.items.some((x: { key: string }) => x.key === "pharmacy")).toBe(false);
  });
  it("monitors organizations: list, drill-down, conversations, orders, activity; suspend blocks members", async () => {
    const a = await createAdmin(); const o = await signupOrg({ orgName: "Monitored Cafe" }); const base = `/v1/orgs/${o.org.uuid}`; const h = bearer(o.token);
    await api.post(`${base}/chatbot/qas`).set(h).send({ question: "Parking?", answer: "Yes, free parking." });
    const s = await botSession(o.org.widgetKey); await s.say("is there parking");
    const list = await api.get("/v1/admin/organizations?q=Monitored").set(bearer(a.token)); expect(list.body.items).toHaveLength(1); expect(list.body.items[0].memberCount).toBe(1); expect(list.body.items[0].conversationCount).toBe(1);
    const d = await api.get(`/v1/admin/organizations/${o.org.uuid}`).set(bearer(a.token)); expect(d.body.organization.counts.qas).toBe(1); expect(d.body.organization.owner.email).toBe(o.email);
    expect((await api.get(`/v1/admin/organizations/${o.org.uuid}/qas`).set(bearer(a.token))).body.items).toHaveLength(1);
    const convs = await api.get(`/v1/admin/organizations/${o.org.uuid}/conversations`).set(bearer(a.token)); expect(convs.body.items).toHaveLength(1);
    const thread = await api.get(`/v1/admin/organizations/${o.org.uuid}/conversations/${convs.body.items[0].id}`).set(bearer(a.token)); expect(thread.body.messages.length).toBeGreaterThanOrEqual(3);
    expect((await api.get("/v1/admin/conversations").set(bearer(a.token))).body.items[0].organizationName).toBe("Monitored Cafe");
    expect((await api.get("/v1/admin/dashboard").set(bearer(a.token))).body.counts.organizations).toBeGreaterThan(0);
    const act = await api.get("/v1/admin/activity").set(bearer(a.token)); expect(act.body.items.some((x: { action: string }) => x.action === "org.created")).toBe(true);
    expect((await api.patch(`/v1/admin/organizations/${o.org.uuid}/status`).set(bearer(a.token)).send({ status: "suspended", reason: "test" })).status).toBe(200);
    expect((await api.get(base).set(h)).status).toBe(403);
    expect((await api.get(`/v1/bot/${o.org.widgetKey}/config`)).status).toBe(404); // widget off while suspended
    expect((await api.patch(`/v1/admin/organizations/${o.org.uuid}/status`).set(bearer(a.token)).send({ status: "active" })).status).toBe(200);
    expect((await api.get(base).set(h)).status).toBe(200);
    const n = await api.get("/v1/admin/notifications").set(bearer(a.token)); expect(n.body.items.some((x: { type: string }) => x.type === "org.created")).toBe(true);
  });
});
