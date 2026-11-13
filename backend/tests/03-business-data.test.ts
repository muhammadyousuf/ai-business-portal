import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { api, bearer, PNG, setupDb, signupOrg, teardown } from "./helpers.js";

beforeAll(setupDb); afterAll(teardown);

describe("branches, catalog, staff, chatbot config and Q&A", () => {
  it("manages branches with hours and main-branch rules", async () => {
    const o = await signupOrg(); const base = `/v1/orgs/${o.org.uuid}`;
    const c = await api.post(`${base}/branches`).set(bearer(o.token)).send({ name: "DHA", phone: "021", hours: [{ day: 1, open: "11:00", close: "23:00" }], deliveryAreas: ["DHA", "Clifton"], deliveryCharge: 150 }); expect(c.status).toBe(201);
    const list = await api.get(`${base}/branches`).set(bearer(o.token)); expect(list.body.items).toHaveLength(2);
    const main = list.body.items.find((b: { isMain: boolean }) => b.isMain);
    expect((await api.delete(`${base}/branches/${main.id}`).set(bearer(o.token))).status).toBe(400);
    expect((await api.patch(`${base}/branches/${c.body.branch.id}`).set(bearer(o.token)).send({ isMain: true })).status).toBe(200);
    expect((await api.delete(`${base}/branches/${main.id}`).set(bearer(o.token))).status).toBe(200);
    expect((await api.post(`${base}/branches`).set(bearer(o.token)).send({ name: "", hours: [{ day: 9 }] })).status).toBe(400);
  });
  it("manages catalog groups and items with validation and image upload", async () => {
    const o = await signupOrg(); const base = `/v1/orgs/${o.org.uuid}/catalog`;
    const g = await api.post(`${base}/groups`).set(bearer(o.token)).send({ name: "Biryani" }); expect(g.status).toBe(201);
    expect((await api.post(`${base}/items`).set(bearer(o.token)).send({ groupId: "000000000000000000000000", name: "X", price: 1 })).status).toBe(400);
    const it = await api.post(`${base}/items`).set(bearer(o.token)).send({ groupId: g.body.group.id, name: "Chicken Biryani", price: 350, options: [{ name: "Portion", choices: [{ label: "Single", delta: 0 }, { label: "Family", delta: 950 }] }] }); expect(it.status).toBe(201); expect(it.body.item.currency).toBe("PKR");
    const img = await api.post(`${base}/items/${it.body.item.id}/image`).set(bearer(o.token)).attach("file", PNG, "b.png"); expect(img.status).toBe(200); expect(img.body.item.imageUrl).toContain("/uploads/");
    expect((await api.delete(`${base}/groups/${g.body.group.id}`).set(bearer(o.token))).status).toBe(400); // has items
    expect((await api.patch(`${base}/items/${it.body.item.id}`).set(bearer(o.token)).send({ price: -1 })).status).toBe(400);
    expect((await api.get(`${base}/items?q=chicken`).set(bearer(o.token))).body.items).toHaveLength(1);
    expect((await api.delete(`${base}/items/${it.body.item.id}`).set(bearer(o.token))).status).toBe(200);
    expect((await api.delete(`${base}/groups/${g.body.group.id}`).set(bearer(o.token))).status).toBe(200);
  });
  it("blocks modules the category does not include", async () => {
    const r = await signupOrg({ categoryKey: "restaurant" });
    expect((await api.get(`/v1/orgs/${r.org.uuid}/staff`).set(bearer(r.token))).status).toBe(403);
    expect((await api.get(`/v1/orgs/${r.org.uuid}/appointments`).set(bearer(r.token))).status).toBe(403);
    const h = await signupOrg({ categoryKey: "hospital" });
    expect((await api.get(`/v1/orgs/${h.org.uuid}/orders`).set(bearer(h.token))).status).toBe(403);
    expect((await api.get(`/v1/orgs/${h.org.uuid}/staff`).set(bearer(h.token))).status).toBe(200);
  });
  it("manages staff profiles with availability and photo", async () => {
    const h = await signupOrg({ categoryKey: "hospital" }); const base = `/v1/orgs/${h.org.uuid}/staff`;
    const d = await api.post(base).set(bearer(h.token)).send({ name: "Dr. Sara Haddad", title: "Dentist", fee: 2000, availability: [{ day: 1, start: "10:00", end: "14:00" }], slotMinutes: 30 }); expect(d.status).toBe(201);
    expect((await api.post(`${base}/${d.body.staff.id}/photo`).set(bearer(h.token)).attach("file", PNG, "p.png")).status).toBe(200);
    expect((await api.patch(`${base}/${d.body.staff.id}`).set(bearer(h.token)).send({ fee: 2500 })).body.staff.fee).toBe(2500);
    expect((await api.post(base).set(bearer(h.token)).send({ name: "Bad", availability: [{ day: 1, start: "1000", end: "14:00" }] })).status).toBe(400);
  });
  it("manages chatbot config, Q&A and embed snippet", async () => {
    const o = await signupOrg(); const base = `/v1/orgs/${o.org.uuid}/chatbot`;
    const cfg = await api.patch(base).set(bearer(o.token)).send({ greeting: "Salam! How can I help?", brandColor: "#d9471f", quickReplies: ["Menu", "Timings"] }); expect(cfg.body.config.brandColor).toBe("#d9471f");
    expect((await api.patch(base).set(bearer(o.token)).send({ brandColor: "red" })).status).toBe(400);
    const qa = await api.post(`${base}/qas`).set(bearer(o.token)).send({ question: "Do you deliver?", answer: "Yes, within 5 km.", keywords: ["deliver", "delivery"] }); expect(qa.status).toBe(201);
    expect((await api.post(`${base}/qas`).set(bearer(o.token)).send({ question: "x", answer: "" })).status).toBe(400);
    expect((await api.patch(`${base}/qas/${qa.body.qa.id}`).set(bearer(o.token)).send({ answer: "Yes, within 10 km." })).body.qa.answer).toContain("10 km");
    expect((await api.get(`${base}/qas?q=deliver`).set(bearer(o.token))).body.items).toHaveLength(1);
    const embed = await api.get(`${base}/embed`).set(bearer(o.token)); expect(embed.body.snippet).toContain(o.org.widgetKey);
    expect((await api.delete(`${base}/qas/${qa.body.qa.id}`).set(bearer(o.token))).status).toBe(200);
  });
});
