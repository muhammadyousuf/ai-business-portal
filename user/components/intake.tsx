"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useApi } from "@assistflow/shared/api/hooks";
import { api, qs } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Select } from "@assistflow/shared/ui/select";
import { Textarea } from "@assistflow/shared/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Loading } from "@assistflow/shared/components/states";
import { Field } from "@assistflow/shared/components/form";
import type { StatusMeta } from "@assistflow/shared/lib/status";
import { useToast } from "@assistflow/shared/ui/toast";
import { useOrg } from "@/lib/org-context";
import { DataTable, Status, fmtDate, money } from "@/components/common";
import { MessageThread, type Msg } from "@/components/message-thread";

export type Kind = "orders" | "appointments" | "inquiries";
type Row = { id: string; number: number; status: string; customer: { name: string; phone: string; address?: string }; createdAt: string; total?: number; currency?: string; items?: { name: string; qty: number; unitPrice: number }[]; deliveryCharge?: number; subtotal?: number; staffName?: string; requestedText?: string; service?: string; type?: string; subject?: string; details?: string; notes?: string; conversationId?: string; statusHistory: { status: string; byName: string; note: string; at: string }[] };

export function IntakeList({ kind, title, description, statusMap, flow }: { kind: Kind; title: string; description: string; statusMap: Record<string, StatusMeta>; flow: Record<string, string[]> }) {
  const { org, base } = useOrg(); const [status, setStatus] = React.useState(""); const [q, setQ] = React.useState(""); const [page, setPage] = React.useState(1);
  const { data, loading, error, refetch } = useApi<{ items: Row[]; total: number; page: number; limit: number; counts: Record<string, number> }>(`/v1/orgs/${org.uuid}/${kind}${qs({ status, q, page, limit: 25 })}`);
  void flow;
  const counts = data?.counts ?? {};
  return (
    <>
      <PageHeader title={title} description={`${description} · ${Object.entries(counts).map(([k, v]) => `${v} ${statusMap[k]?.label.toLowerCase() ?? k}`).join(" · ") || "nothing yet"}`} />
      <div className="flex flex-wrap gap-2"><Input placeholder="Search name, phone or #" className="h-8 w-56" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /><Select className="h-8 w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select></div>
      <DataTable rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: `No ${kind} yet`, description: "Requests collected by the chatbot appear here." }} page={data?.page} limit={data?.limit} total={data?.total} onPage={setPage} cols={[
        { key: "n", label: "#", render: (r) => <Link href={`${base}/${kind}/${r.id}`} className="font-medium hover:underline">#{r.number}</Link> },
        { key: "c", label: "Customer", render: (r) => <span>{r.customer?.name || "—"}<span className="block text-xs text-muted-foreground">{r.customer?.phone}</span></span> },
        { key: "d", label: kind === "orders" ? "Items" : kind === "appointments" ? "Request" : "Subject", className: "max-w-sm", render: (r) => <span className="line-clamp-2 text-muted-foreground">{kind === "orders" ? r.items?.map((i) => `${i.qty}× ${i.name}`).join(", ") : kind === "appointments" ? `${r.staffName ? r.staffName + " · " : ""}${r.service ? r.service + " · " : ""}${r.requestedText ?? ""}` : `${r.type} · ${r.subject}`}</span> },
        ...(kind === "orders" ? [{ key: "t", label: "Total", className: "text-right tabular font-medium", render: (r: Row) => money(r.total ?? 0, r.currency) }] : []),
        { key: "s", label: "Status", render: (r) => <Status value={r.status} map={statusMap} /> },
        { key: "w", label: "Created", className: "text-right text-xs text-muted-foreground", render: (r) => fmtDate(r.createdAt) },
      ]} />
    </>
  );
}

export function IntakeDetail({ kind, label, statusMap, flow }: { kind: Kind; label: string; statusMap: Record<string, StatusMeta>; flow: Record<string, string[]> }) {
  const { id } = useParams<{ id: string }>(); const { org, base } = useOrg(); const toast = useToast();
  const key = kind === "orders" ? "order" : kind === "appointments" ? "appointment" : "inquiry";
  const { data, loading, refetch } = useApi<Record<string, unknown> & { messages: Msg[] }>(`/v1/orgs/${org.uuid}/${kind}/${id}`);
  const [note, setNote] = React.useState(""); const [busy, setBusy] = React.useState(false);
  const staff = useApi<{ items: { id: string; name: string }[] }>(kind === "appointments" ? `/v1/orgs/${org.uuid}/staff` : null);
  if (loading || !data) return <Loading />;
  const r = data[key] as Row;
  async function setStatus(status: string) { setBusy(true); try { await api.patch(`/v1/orgs/${org.uuid}/${kind}/${id}/status`, { status, note }); setNote(""); toast.success(`${label} ${statusMap[status]?.label.toLowerCase() ?? status}`); await refetch(); } catch (e) { toast.error("Could not update", (e as Error).message); } finally { setBusy(false); } }
  return (
    <>
      <nav className="flex items-center gap-1 text-xs text-muted-foreground"><Link href={`${base}/${kind}`} className="hover:text-foreground">{label}s</Link><ChevronRight className="size-3" /><span className="text-foreground">#{r.number}</span></nav>
      <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold tracking-tight">{label} #{r.number}</h1><Status value={r.status} map={statusMap} /><span className="text-sm text-muted-foreground">· {fmtDate(r.createdAt)}</span></div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card><CardHeader><CardTitle>Details</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
            {kind === "orders" ? <table className="w-full"><tbody>{r.items?.map((it, i) => <tr key={i} className="border-b last:border-0"><td className="py-1.5">{it.qty} × {it.name}</td><td className="py-1.5 text-right tabular">{money(it.qty * it.unitPrice, r.currency)}</td></tr>)}</tbody><tfoot><tr><td className="pt-2 text-right text-muted-foreground">Delivery</td><td className="pt-2 text-right tabular">{money(r.deliveryCharge ?? 0, r.currency)}</td></tr><tr><td className="pt-1 text-right font-semibold">Total</td><td className="pt-1 text-right text-lg font-semibold tabular">{money(r.total ?? 0, r.currency)}</td></tr></tfoot></table> : null}
            {kind === "appointments" ? <dl className="grid gap-2 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">With</dt><dd>{r.staffName || "Not assigned"}</dd></div><div><dt className="text-xs text-muted-foreground">Service</dt><dd>{r.service || "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Requested</dt><dd>{r.requestedText || "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Notes</dt><dd>{r.notes || "—"}</dd></div></dl> : null}
            {kind === "inquiries" ? <dl className="grid gap-2"><div><dt className="text-xs text-muted-foreground">Type</dt><dd className="capitalize">{r.type}</dd></div><div><dt className="text-xs text-muted-foreground">Subject</dt><dd>{r.subject}</dd></div><div><dt className="text-xs text-muted-foreground">Details</dt><dd className="whitespace-pre-wrap">{r.details}</dd></div></dl> : null}
            {r.notes && kind === "orders" ? <p className="rounded bg-warning-soft/50 px-2 py-1 text-xs">Note: {r.notes}</p> : null}
          </CardContent></Card>
          {kind === "appointments" && staff.data ? <Card><CardHeader><CardTitle>Assign</CardTitle></CardHeader><CardContent className="flex flex-wrap items-end gap-3"><Field label="Staff" className="min-w-56"><Select defaultValue="" onChange={async (e) => { if (!e.target.value) return; await api.patch(`/v1/orgs/${org.uuid}/appointments/${id}`, { staffId: e.target.value }); toast.success("Assigned"); await refetch(); }}><option value="">{r.staffName || "Choose…"}</option>{staff.data.items.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field></CardContent></Card> : null}
          {data.messages.length ? <Card><CardHeader><CardTitle>Conversation</CardTitle></CardHeader><CardContent><MessageThread messages={data.messages} compact />{r.conversationId ? <Link href={`${base}/inbox/${r.conversationId}`} className="mt-3 inline-block text-xs text-brand hover:underline">Open in inbox</Link> : null}</CardContent></Card> : null}
        </div>
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Customer</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p className="font-medium">{r.customer?.name || "—"}</p><p className="text-muted-foreground"><a href={`tel:${r.customer?.phone}`} className="hover:underline">{r.customer?.phone}</a></p>{r.customer?.address ? <p className="text-muted-foreground">{r.customer.address}</p> : null}</CardContent></Card>
          <Card><CardHeader><CardTitle>Update status</CardTitle></CardHeader><CardContent className="space-y-3">
            {flow[r.status]?.length ? <><Textarea placeholder="Note to the customer (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" /><div className="flex flex-wrap gap-2">{flow[r.status].map((s) => <Button key={s} size="sm" variant={["cancelled", "no_show"].includes(s) ? "outline" : "default"} disabled={busy} onClick={() => setStatus(s)}>{statusMap[s]?.label ?? s}</Button>)}</div><p className="text-xs text-muted-foreground">The customer sees the change in their chat.</p></> : <p className="text-sm text-muted-foreground">This {label.toLowerCase()} is {statusMap[r.status]?.label.toLowerCase()}. No further changes.</p>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>History</CardTitle></CardHeader><CardContent className="space-y-2 text-xs">{r.statusHistory.map((h, i) => <div key={i} className="flex justify-between gap-2"><span><span className="font-medium">{statusMap[h.status]?.label ?? h.status}</span> by {h.byName || h.status === "pending" || h.status === "requested" || h.status === "new" ? h.byName || "chatbot" : "team"}{h.note ? ` · ${h.note}` : ""}</span><span className="shrink-0 text-muted-foreground">{fmtDate(h.at)}</span></div>)}</CardContent></Card>
        </div>
      </div>
    </>
  );
}
