"use client";
import * as React from "react";
import Link from "next/link";
import { useApi } from "@assistflow/shared/api/hooks";
import { qs } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Select } from "@assistflow/shared/ui/select";
import type { StatusMeta } from "@assistflow/shared/lib/status";
import { DataTable, Status, fmtDate, money, relativeTime, type Col } from "@/components/common";

type Row = { id: string; orgId: string; organizationName: string; status: string; number?: number; customer?: { name: string; phone: string }; lastMessagePreview?: string; lastMessageAt?: string; total?: number; currency?: string; staffName?: string; requestedText?: string; type?: string; subject?: string; createdAt: string };

export function CrossOrgList({ kind, title, description, statusMap }: { kind: "conversations" | "orders" | "appointments" | "inquiries"; title: string; description: string; statusMap: Record<string, StatusMeta> }) {
  const [status, setStatus] = React.useState(""); const [page, setPage] = React.useState(1);
  const { data, loading, error, refetch } = useApi<{ items: Row[]; total: number; page: number; limit: number }>(`/v1/admin/${kind}${qs({ status, page, limit: 25 })}`);
  const cols: Col<Row>[] = [
    { key: "org", label: "Organization", render: (r) => <Link href={`/organizations/${r.orgId}`} className="font-medium hover:underline">{r.organizationName || r.orgId}</Link> },
    kind === "conversations" ? { key: "c", label: "Customer", render: (r) => <Link href={`/organizations/${r.orgId}/conversations/${r.id}`} className="hover:underline">{r.customer?.name || "Anonymous visitor"}</Link> } : { key: "n", label: "#", render: (r) => <span className="font-medium">#{r.number}</span> },
    ...(kind !== "conversations" ? [{ key: "cust", label: "Customer", render: (r: Row) => `${r.customer?.name || "—"}${r.customer?.phone ? " · " + r.customer.phone : ""}` }] : []),
    { key: "d", label: kind === "conversations" ? "Last message" : kind === "orders" ? "Total" : kind === "appointments" ? "Requested" : "Subject", className: "max-w-sm", render: (r) => kind === "conversations" ? <span className="line-clamp-1 text-muted-foreground">{r.lastMessagePreview}</span> : kind === "orders" ? money(r.total ?? 0, r.currency) : kind === "appointments" ? `${r.staffName ? r.staffName + " · " : ""}${r.requestedText ?? ""}` : `${r.type} · ${r.subject}` },
    { key: "s", label: "Status", render: (r) => <Status value={r.status} map={statusMap} /> },
    { key: "t", label: "When", className: "text-right text-xs text-muted-foreground", render: (r) => (kind === "conversations" ? relativeTime(r.lastMessageAt ?? r.createdAt, new Date()) : fmtDate(r.createdAt)) },
  ];
  return <><PageHeader title={title} description={description} /><Select className="h-8 w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select>
    <DataTable rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: `No ${kind} yet` }} page={data?.page} limit={data?.limit} total={data?.total} onPage={setPage} cols={cols} /></>;
}
