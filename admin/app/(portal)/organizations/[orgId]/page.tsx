"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Pause, Play } from "lucide-react";
import { useApi } from "@assistflow/shared/api/hooks";
import { api, qs } from "@assistflow/shared/api/client";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@assistflow/shared/ui/tabs";
import { BrandMark } from "@assistflow/shared/components/brand-mark";
import { ConfirmDialog } from "@assistflow/shared/components/confirm";
import { useToast } from "@assistflow/shared/ui/toast";
import { Loading as LoadingState } from "@assistflow/shared/components/states";
import { appointmentStatus, conversationStatus, inquiryStatus, orderStatus, organizationStatus, roleMeta } from "@assistflow/shared/lib/status";
import { DataTable, ErrorState, Pill, Status, fmtDate, money, relativeTime } from "@/components/common";

interface OrgDetail { organization: { uuid: string; name: string; slug: string; status: string; categoryKey: string; description: string; phone: string; email: string; website: string; logoUrl: string; address: Record<string, string>; widgetKey: string; allowedOrigins: string[]; createdAt: string; category: { key: string; name: string; modules: string[]; labels: Record<string, string> } | null; owner: { name: string; email: string; phone: string } | null; counts: Record<string, number>; chatbot: { name: string; isEnabled: boolean; greeting: string } | null } }

function useList<T>(path: string, page: number) { return useApi<{ items: T[]; total: number; page: number; limit: number }>(`${path}${qs({ page, limit: 25 })}`); }

export default function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const toast = useToast();
  const { data, loading, error, refetch } = useApi<OrgDetail>(`/v1/admin/organizations/${orgId}`);
  const [confirm, setConfirm] = React.useState<"suspend" | "activate" | null>(null);
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (loading || !data) return <LoadingState />;
  const o = data.organization; const c = o.counts; const mods = new Set(o.category?.modules ?? []);
  const labels = o.category?.labels ?? {};
  async function setStatus(status: "active" | "suspended") { await api.patch(`/v1/admin/organizations/${orgId}/status`, { status, reason: status === "suspended" ? "Suspended by admin" : "" }); toast.success(`Organization ${status}`); await refetch(); }
  return (
    <>
      <nav className="flex items-center gap-1 text-xs text-muted-foreground"><Link href="/organizations" className="hover:text-foreground">Organizations</Link><ChevronRight className="size-3" /><span className="text-foreground">{o.name}</span></nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">{o.logoUrl ? <img src={o.logoUrl} alt="" className="size-12 rounded-lg object-cover" /> : <BrandMark text={o.name.slice(0, 1).toUpperCase()} className="size-12 text-lg" />}
          <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold tracking-tight">{o.name}</h1><Status value={o.status} map={organizationStatus} /><Pill tone="brand">{o.category?.name ?? o.categoryKey}</Pill></div><p className="mt-1 text-sm text-muted-foreground">Owner {o.owner?.name || o.owner?.email} · {o.owner?.email} · joined {fmtDate(o.createdAt)}</p></div></div>
        <div className="flex gap-2">{o.status === "suspended" ? <Button size="sm" onClick={() => setConfirm("activate")}><Play /> Reactivate</Button> : o.status === "active" ? <Button size="sm" variant="destructive" onClick={() => setConfirm("suspend")}><Pause /> Suspend</Button> : null}</div>
      </div>
      <ConfirmDialog open={!!confirm} onOpenChange={() => setConfirm(null)} title={confirm === "suspend" ? `Suspend ${o.name}?` : `Reactivate ${o.name}?`} description={confirm === "suspend" ? "Members lose access and the chatbot stops answering until reactivated." : "Members regain access and the chatbot resumes."} destructive={confirm === "suspend"} confirmLabel={confirm === "suspend" ? "Suspend" : "Reactivate"} onConfirm={() => setStatus(confirm === "suspend" ? "suspended" : "active")} />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {[["Members", c.members], ["Branches", c.branches], ["Q&A", c.qas], [labels.catalogItem ? labels.catalogItem + "s" : "Items", c.catalogItems], [labels.staff ?? "Staff", c.staff], ["Conversations", c.conversations], ["Orders", c.orders], ["Appointments", c.appointments + c.inquiries]].map(([k, v]) => <Card key={String(k)} className="p-3"><p className="text-[11px] text-muted-foreground">{k}</p><p className="text-lg font-semibold tabular">{v}</p></Card>)}
      </section>
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="members">Members</TabsTrigger>{mods.has("branches") ? <TabsTrigger value="branches">Branches</TabsTrigger> : null}{mods.has("catalog") ? <TabsTrigger value="catalog">{labels.catalogGroup ?? "Catalog"}s</TabsTrigger> : null}{mods.has("staff") ? <TabsTrigger value="staff">{labels.staff ?? "Staff"}</TabsTrigger> : null}
          <TabsTrigger value="qas">Chatbot Q&A</TabsTrigger><TabsTrigger value="conversations">Conversations</TabsTrigger>{mods.has("orders") ? <TabsTrigger value="orders">Orders</TabsTrigger> : null}{mods.has("appointments") ? <TabsTrigger value="appointments">{labels.appointment ?? "Appointment"}s</TabsTrigger> : null}{mods.has("inquiries") ? <TabsTrigger value="inquiries">Inquiries</TabsTrigger> : null}<TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardHeader><CardTitle>Profile</CardTitle></CardHeader><CardContent><dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {[["Description", o.description || "—"], ["Phone", o.phone || "—"], ["Email", o.email || "—"], ["Website", o.website || "—"], ["Address", [o.address?.line1, o.address?.city, o.address?.country].filter(Boolean).join(", ") || "—"], ["Slug", o.slug], ["Organization UUID", o.uuid], ["Widget key", o.widgetKey], ["Allowed origins", o.allowedOrigins.join(", ") || "(none, dev only)"]].map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="break-all">{v}</dd></div>)}
          </dl></CardContent></Card>
          <Card><CardHeader><CardTitle>Chatbot</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{o.chatbot ? <><p><span className="text-muted-foreground">Name:</span> {o.chatbot.name}</p><p><span className="text-muted-foreground">Enabled:</span> {o.chatbot.isEnabled ? "Yes" : "No"}</p><p><span className="text-muted-foreground">Greeting:</span> {o.chatbot.greeting}</p></> : <p className="text-muted-foreground">Not configured.</p>}</CardContent></Card>
        </TabsContent>
        <TabsContent value="members"><MembersTab orgId={orgId} /></TabsContent>
        <TabsContent value="branches"><BranchesTab orgId={orgId} /></TabsContent>
        <TabsContent value="catalog"><CatalogTab orgId={orgId} /></TabsContent>
        <TabsContent value="staff"><StaffTab orgId={orgId} /></TabsContent>
        <TabsContent value="qas"><QasTab orgId={orgId} /></TabsContent>
        <TabsContent value="conversations"><ConversationsTab orgId={orgId} /></TabsContent>
        <TabsContent value="orders"><IntakeTab orgId={orgId} kind="orders" /></TabsContent>
        <TabsContent value="appointments"><IntakeTab orgId={orgId} kind="appointments" /></TabsContent>
        <TabsContent value="inquiries"><IntakeTab orgId={orgId} kind="inquiries" /></TabsContent>
        <TabsContent value="activity"><ActivityTab orgId={orgId} /></TabsContent>
      </Tabs>
    </>
  );
}

function MembersTab({ orgId }: { orgId: string }) {
  const { data, loading, error, refetch } = useApi<{ items: { id: string; name: string; email: string; role: string; status: string; joinedAt: string; lastLoginAt?: string }[]; pendingInvitations: { id: string; email: string; expiresAt: string }[] }>(`/v1/admin/organizations/${orgId}/members`);
  return <div className="space-y-4"><DataTable rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: "No members" }} cols={[{ key: "n", label: "Name", render: (m) => <span className="font-medium">{m.name || "—"}</span> }, { key: "e", label: "Email", render: (m) => m.email }, { key: "r", label: "Role", render: (m) => <Status value={m.role} map={roleMeta} /> }, { key: "s", label: "Status", render: (m) => <Pill tone={m.status === "active" ? "success" : "neutral"}>{m.status}</Pill> }, { key: "j", label: "Joined", className: "text-xs text-muted-foreground", render: (m) => fmtDate(m.joinedAt) }, { key: "l", label: "Last login", className: "text-xs text-muted-foreground", render: (m) => fmtDate(m.lastLoginAt) }]} />
    {data?.pendingInvitations.length ? <Card><CardHeader><CardTitle>Pending invitations</CardTitle></CardHeader><CardContent className="divide-y text-sm">{data.pendingInvitations.map((i) => <div key={i.id} className="flex justify-between py-2"><span>{i.email}</span><span className="text-xs text-muted-foreground">expires {fmtDate(i.expiresAt)}</span></div>)}</CardContent></Card> : null}</div>;
}
function BranchesTab({ orgId }: { orgId: string }) {
  const { data, loading, error, refetch } = useApi<{ items: { id: string; name: string; phone: string; isMain: boolean; isActive: boolean; address: Record<string, string>; deliveryAreas: string[] }[] }>(`/v1/admin/organizations/${orgId}/branches`);
  return <DataTable rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: "No branches" }} cols={[{ key: "n", label: "Branch", render: (b) => <span className="font-medium">{b.name}{b.isMain ? <Pill tone="brand" className="ml-2">Main</Pill> : null}</span> }, { key: "a", label: "Address", render: (b) => [b.address?.line1, b.address?.city].filter(Boolean).join(", ") || "—" }, { key: "p", label: "Phone", render: (b) => b.phone || "—" }, { key: "d", label: "Delivery areas", render: (b) => b.deliveryAreas?.join(", ") || "—" }, { key: "s", label: "Active", render: (b) => (b.isActive ? "Yes" : "No") }]} />;
}
function CatalogTab({ orgId }: { orgId: string }) {
  const { data, loading, error, refetch } = useApi<{ groups: { id: string; name: string }[]; items: { id: string; name: string; groupId: string; price: number; currency: string; isAvailable: boolean; imageUrl: string }[] }>(`/v1/admin/organizations/${orgId}/catalog`);
  const rows = data?.items.map((i) => ({ ...i, groupName: data.groups.find((g) => g.id === i.groupId)?.name ?? "" }));
  return <DataTable rows={rows} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: "No items yet" }} cols={[{ key: "n", label: "Item", render: (i) => <span className="flex items-center gap-2">{i.imageUrl ? <img src={i.imageUrl} alt="" className="size-8 rounded object-cover" /> : null}<span className="font-medium">{i.name}</span></span> }, { key: "g", label: "Group", render: (i) => i.groupName }, { key: "p", label: "Price", className: "text-right tabular", render: (i) => money(i.price, i.currency) }, { key: "a", label: "Available", render: (i) => (i.isAvailable ? "Yes" : "No") }]} />;
}
function StaffTab({ orgId }: { orgId: string }) {
  const { data, loading, error, refetch } = useApi<{ items: { id: string; name: string; title: string; specialty: string; fee: number; isActive: boolean; availability: { day: number; start: string; end: string }[] }[] }>(`/v1/admin/organizations/${orgId}/staff`);
  const D = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return <DataTable rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: "No staff profiles" }} cols={[{ key: "n", label: "Name", render: (s) => <span className="font-medium">{s.name}</span> }, { key: "t", label: "Title", render: (s) => [s.title, s.specialty].filter(Boolean).join(" · ") || "—" }, { key: "f", label: "Fee", className: "text-right tabular", render: (s) => (s.fee ? money(s.fee) : "—") }, { key: "a", label: "Availability", className: "text-xs", render: (s) => s.availability.map((a) => `${D[a.day]} ${a.start}–${a.end}`).join(", ") || "—" }, { key: "s", label: "Active", render: (s) => (s.isActive ? "Yes" : "No") }]} />;
}
function QasTab({ orgId }: { orgId: string }) {
  const { data, loading, error, refetch } = useApi<{ config: { greeting: string; fallbackMessage: string; isEnabled: boolean } | null; items: { id: string; question: string; answer: string; keywords: string[]; isActive: boolean; hits: number }[] }>(`/v1/admin/organizations/${orgId}/qas`);
  return <div className="space-y-4">{data?.config ? <Card><CardContent className="grid gap-2 p-4 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Greeting:</span> {data.config.greeting}</p><p><span className="text-muted-foreground">Fallback:</span> {data.config.fallbackMessage}</p></CardContent></Card> : null}
    <DataTable rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: "No Q&A configured" }} cols={[{ key: "q", label: "Question", render: (q) => <span className="font-medium">{q.question}</span> }, { key: "a", label: "Answer", className: "max-w-md", render: (q) => <span className="line-clamp-2 text-muted-foreground">{q.answer}</span> }, { key: "k", label: "Keywords", className: "text-xs", render: (q) => q.keywords.join(", ") || "—" }, { key: "h", label: "Hits", className: "text-right tabular", render: (q) => q.hits }, { key: "s", label: "Active", render: (q) => (q.isActive ? "Yes" : "No") }]} /></div>;
}
function ConversationsTab({ orgId }: { orgId: string }) {
  const [page, setPage] = React.useState(1);
  const { data, loading, error, refetch } = useList<{ id: string; customer: { name: string; phone: string }; status: string; lastMessagePreview: string; lastMessageAt: string }>(`/v1/admin/organizations/${orgId}/conversations`, page);
  return <DataTable rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: "No conversations yet" }} page={data?.page} limit={data?.limit} total={data?.total} onPage={setPage} cols={[{ key: "c", label: "Customer", render: (c) => <Link href={`/organizations/${orgId}/conversations/${c.id}`} className="font-medium hover:underline">{c.customer?.name || "Anonymous visitor"}</Link> }, { key: "p", label: "Phone", render: (c) => c.customer?.phone || "—" }, { key: "s", label: "Status", render: (c) => <Status value={c.status} map={conversationStatus} /> }, { key: "l", label: "Last message", className: "max-w-sm", render: (c) => <span className="line-clamp-1 text-muted-foreground">{c.lastMessagePreview}</span> }, { key: "t", label: "When", className: "text-right text-xs text-muted-foreground", render: (c) => relativeTime(c.lastMessageAt, new Date()) }]} />;
}
function IntakeTab({ orgId, kind }: { orgId: string; kind: "orders" | "appointments" | "inquiries" }) {
  const [page, setPage] = React.useState(1);
  const { data, loading, error, refetch } = useList<{ id: string; number: number; customer: { name: string; phone: string }; status: string; total?: number; currency?: string; staffName?: string; requestedText?: string; type?: string; subject?: string; createdAt: string }>(`/v1/admin/organizations/${orgId}/${kind}`, page);
  const map = kind === "orders" ? orderStatus : kind === "appointments" ? appointmentStatus : inquiryStatus;
  return <DataTable rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: `No ${kind} yet` }} page={data?.page} limit={data?.limit} total={data?.total} onPage={setPage} cols={[{ key: "n", label: "#", render: (r) => <span className="font-medium">#{r.number}</span> }, { key: "c", label: "Customer", render: (r) => `${r.customer?.name || "—"} · ${r.customer?.phone || ""}` }, { key: "d", label: kind === "orders" ? "Total" : kind === "appointments" ? "Requested" : "Subject", render: (r) => (kind === "orders" ? money(r.total ?? 0, r.currency) : kind === "appointments" ? `${r.staffName ? r.staffName + " · " : ""}${r.requestedText ?? ""}` : `${r.type} · ${r.subject}`) }, { key: "s", label: "Status", render: (r) => <Status value={r.status} map={map} /> }, { key: "t", label: "Created", className: "text-right text-xs text-muted-foreground", render: (r) => fmtDate(r.createdAt) }]} />;
}
function ActivityTab({ orgId }: { orgId: string }) {
  const [page, setPage] = React.useState(1);
  const { data, loading, error, refetch } = useList<{ id: string; summary: string; actorType: string; createdAt: string }>(`/v1/admin/organizations/${orgId}/activity`, page);
  return <DataTable rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: "No activity yet" }} page={data?.page} limit={data?.limit} total={data?.total} onPage={setPage} cols={[{ key: "s", label: "Event", render: (a) => a.summary }, { key: "a", label: "Actor", render: (a) => <Pill>{a.actorType}</Pill> }, { key: "t", label: "When", className: "text-right text-xs text-muted-foreground", render: (a) => fmtDate(a.createdAt) }]} />;
}
