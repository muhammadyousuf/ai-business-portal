import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { addMember, api, bearer, createAuthOnly, randEmail, setupDb, signupOrg, teardown } from "./helpers.js";

beforeAll(setupDb); afterAll(teardown);

describe("members, invitations and roles", () => {
  it("invites by email, returns a shareable link, and the invitee becomes a member on accept", async () => {
    const o = await signupOrg();
    const email = randEmail("inv");
    const inv = await api.post(`/v1/orgs/${o.org.uuid}/invitations`).set(bearer(o.token)).send({ emails: [email, "bad"] }); expect(inv.status).toBe(400);
    const ok = await api.post(`/v1/orgs/${o.org.uuid}/invitations`).set(bearer(o.token)).send({ emails: [email] }); expect(ok.status).toBe(201);
    const token = ok.body.results[0].link.split("/invite/")[1];
    const preview = await api.get(`/v1/invitations/${token}`); expect(preview.status).toBe(200); expect(preview.body.invitation.organization.name).toBe(o.org.name); expect(preview.body.invitation.accountExists).toBe(false);
    const wrongUser = await createAuthOnly();
    expect((await api.post(`/v1/invitations/${token}/accept`).set(bearer(wrongUser.token))).status).toBe(403);
    const invitee = await createAuthOnly(email);
    const acc = await api.post(`/v1/invitations/${token}/accept`).set(bearer(invitee.token)); expect(acc.status).toBe(200); expect(acc.body.role).toBe("member");
    expect((await api.post(`/v1/invitations/${token}/accept`).set(bearer(invitee.token))).status).toBe(400); // single use
    const members = await api.get(`/v1/orgs/${o.org.uuid}/members`).set(bearer(o.token)); expect(members.body.items).toHaveLength(2);
    const n = await api.get("/v1/me/notifications").set(bearer(o.token)); expect(n.body.items.some((x: { type: string }) => x.type === "member.joined")).toBe(true);
  });
  it("invites an existing user via in-app notification", async () => {
    const o = await signupOrg(); const other = await signupOrg();
    const r = await api.post(`/v1/orgs/${o.org.uuid}/invitations`).set(bearer(o.token)).send({ emails: [other.email] }); expect(r.body.results[0].delivery).toBe("in_app");
    const n = await api.get("/v1/me/notifications").set(bearer(other.token)); expect(n.body.items[0].type).toBe("invitation");
    const token = r.body.results[0].link.split("/invite/")[1];
    expect((await api.post(`/v1/invitations/${token}/accept`).set(bearer(other.token))).status).toBe(200);
    expect((await api.get("/v1/me/organizations").set(bearer(other.token))).body.items).toHaveLength(2);
  });
  it("enforces owner-only permissions", async () => {
    const o = await signupOrg(); const m = await addMember(o.token, o.org.uuid); const m2 = await addMember(o.token, o.org.uuid);
    const meId = (await api.get("/v1/me").set(bearer(m2.token))).body.user.id;
    expect((await api.post(`/v1/orgs/${o.org.uuid}/invitations`).set(bearer(m.token)).send({ emails: [randEmail()] })).status).toBe(201); // members may invite
    expect((await api.delete(`/v1/orgs/${o.org.uuid}/members/${meId}`).set(bearer(m.token))).status).toBe(403); // members cannot remove
    expect((await api.delete(`/v1/orgs/${o.org.uuid}`).set(bearer(m.token)).send({ confirmName: o.org.name })).status).toBe(403); // members cannot delete
    expect((await api.post(`/v1/orgs/${o.org.uuid}/rotate-widget-key`).set(bearer(m.token))).status).toBe(403);
    expect((await api.delete(`/v1/orgs/${o.org.uuid}/members/${meId}`).set(bearer(o.token))).status).toBe(200); // owner can
    expect((await api.get(`/v1/orgs/${o.org.uuid}`).set(bearer(m2.token))).status).toBe(403); // removed member loses access
  });
  it("supports leave, transfer ownership and soft delete", async () => {
    const o = await signupOrg(); const m = await addMember(o.token, o.org.uuid);
    expect((await api.post(`/v1/orgs/${o.org.uuid}/leave`).set(bearer(o.token))).status).toBe(400); // owner cannot leave
    const mId = (await api.get("/v1/me").set(bearer(m.token))).body.user.id;
    expect((await api.post(`/v1/orgs/${o.org.uuid}/transfer-ownership`).set(bearer(o.token)).send({ userId: mId })).status).toBe(200);
    expect((await api.get(`/v1/orgs/${o.org.uuid}`).set(bearer(m.token))).body.organization.role).toBe("owner");
    expect((await api.post(`/v1/orgs/${o.org.uuid}/leave`).set(bearer(o.token))).status).toBe(200); // former owner (now member) can leave
    expect((await api.delete(`/v1/orgs/${o.org.uuid}`).set(bearer(m.token)).send({ confirmName: "wrong" })).status).toBe(400);
    expect((await api.delete(`/v1/orgs/${o.org.uuid}`).set(bearer(m.token)).send({ confirmName: o.org.name })).status).toBe(200);
    expect((await api.get(`/v1/orgs/${o.org.uuid}`).set(bearer(m.token))).status).toBe(404);
  });
  it("isolates organizations: a member of one org cannot read another", async () => {
    const a = await signupOrg(); const b = await signupOrg();
    expect((await api.get(`/v1/orgs/${b.org.uuid}`).set(bearer(a.token))).status).toBe(403);
    expect((await api.get(`/v1/orgs/${b.org.uuid}/branches`).set(bearer(a.token))).status).toBe(403);
    expect((await api.get(`/v1/orgs/${b.org.uuid}/conversations`).set(bearer(a.token))).status).toBe(403);
    expect((await api.get(`/v1/orgs/00000000-0000-0000-0000-000000000000`).set(bearer(a.token))).status).toBe(404);
  });
});

describe("invitation signup for new accounts", () => {
  it("creates the account server-side and joins in one step, then the member can sign in", async () => {
    const { api: a, bearer: b, randEmail: r, signupOrg: s, signIn: si, PASSWORD: P } = await import("./helpers.js");
    const o = await s(); const email = r("newinv");
    const inv = await a.post(`/v1/orgs/${o.org.uuid}/invitations`).set(b(o.token)).send({ emails: [email] });
    const token = inv.body.results[0].link.split("/invite/")[1];
    expect((await a.post(`/v1/invitations/${token}/signup`).send({ name: "A", password: "short" })).status).toBe(400);
    const ok = await a.post(`/v1/invitations/${token}/signup`).send({ name: "Ayesha Noor", password: P }); expect(ok.status).toBe(201); expect(ok.body.role).toBe("member");
    const t = await si(email, P);
    const orgs = await a.get("/v1/me/organizations").set(b(t)); expect(orgs.body.items[0].uuid).toBe(o.org.uuid); expect(orgs.body.items[0].role).toBe("member");
    expect((await a.post(`/v1/invitations/${token}/signup`).send({ name: "Dup", password: P })).status).toBe(400); // used
    const { deleteAuthUser } = await import("../src/services/supabase-admin.js"); const { findAuthUserByEmail } = await import("../src/services/supabase-admin.js");
    const u = await findAuthUserByEmail(email); if (u) await deleteAuthUser(u.id);
  });
});
