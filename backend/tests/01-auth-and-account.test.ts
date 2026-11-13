import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { api, bearer, createAuthOnly, PNG, randEmail, setupDb, signupOrg, teardown, PASSWORD } from "./helpers.js";

beforeAll(setupDb); afterAll(teardown);

describe("client signup and account", () => {
  it("rejects weak passwords and unknown categories", async () => {
    expect((await api.post("/v1/auth/signup").send({ email: randEmail(), password: "short", name: "A B", orgName: "X Y", categoryKey: "restaurant" })).status).toBe(400);
    expect((await api.post("/v1/auth/signup").send({ email: randEmail(), password: PASSWORD, name: "A B", orgName: "X Y", categoryKey: "nope" })).status).toBe(400);
  });
  it("lists public categories", async () => {
    const r = await api.get("/v1/auth/categories"); expect(r.status).toBe(200);
    expect(r.body.items.map((c: { key: string }) => c.key)).toEqual(expect.arrayContaining(["restaurant", "hospital", "salon", "gym", "school"]));
  });
  it("creates user + organization + owner membership + main branch + chatbot config", async () => {
    const o = await signupOrg({ orgName: "Kababjees" });
    expect(o.org.uuid).toMatch(/^[0-9a-f-]{36}$/); expect(o.org.widgetKey).toMatch(/^wk_/);
    const me = await api.get("/v1/me").set(bearer(o.token)); expect(me.status).toBe(200); expect(me.body.user.email).toBe(o.email);
    const orgs = await api.get("/v1/me/organizations").set(bearer(o.token)); expect(orgs.body.items[0].role).toBe("owner"); expect(orgs.body.items[0].category.modules).toContain("orders");
    const branches = await api.get(`/v1/orgs/${o.org.uuid}/branches`).set(bearer(o.token)); expect(branches.body.items).toHaveLength(1); expect(branches.body.items[0].isMain).toBe(true);
    const cfg = await api.get(`/v1/orgs/${o.org.uuid}/chatbot`).set(bearer(o.token)); expect(cfg.body.config.greeting).toContain("Kababjees");
  });
  it("rejects duplicate signup emails", async () => {
    const o = await signupOrg(); const dup = await api.post("/v1/auth/signup").send({ email: o.email, password: PASSWORD, name: "Dup", orgName: "Dup Org", categoryKey: "salon" }); expect(dup.status).toBe(409);
  });
  it("requires a valid JWT", async () => {
    expect((await api.get("/v1/me")).status).toBe(401);
    expect((await api.get("/v1/me").set(bearer("not-a-token"))).status).toBe(401);
  });
  it("updates profile, avatar, notification preferences and password", async () => {
    const o = await signupOrg();
    const p = await api.patch("/v1/me").set(bearer(o.token)).send({ name: "Renamed Owner", phone: "+92300" }); expect(p.body.user.name).toBe("Renamed Owner");
    const av = await api.post("/v1/me/avatar").set(bearer(o.token)).attach("file", PNG, "a.png"); expect(av.status).toBe(200); expect(av.body.user.avatarUrl).toContain("/uploads/");
    const bad = await api.post("/v1/me/avatar").set(bearer(o.token)).attach("file", Buffer.from("not an image"), "a.png"); expect(bad.status).toBe(400);
    const prefs = await api.patch("/v1/me/notification-preferences").set(bearer(o.token)).send({ newOrders: false }); expect(prefs.body.notificationPrefs.newOrders).toBe(false);
    const wrong = await api.post("/v1/me/change-password").set(bearer(o.token)).send({ currentPassword: "wrong-pass1", newPassword: "NewPassw0rd" }); expect(wrong.status).toBe(401);
    const ok = await api.post("/v1/me/change-password").set(bearer(o.token)).send({ currentPassword: PASSWORD, newPassword: "NewPassw0rd" }); expect(ok.status).toBe(200);
  });
  it("auto-creates a user record for an auth-only account and shows no organizations", async () => {
    const raw = await createAuthOnly();
    const orgs = await api.get("/v1/me/organizations").set(bearer(raw.token)); expect(orgs.status).toBe(200); expect(orgs.body.items).toHaveLength(0);
  });
});
