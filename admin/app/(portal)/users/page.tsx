"use client";
import * as React from "react";
import { useApi } from "@assistflow/shared/api/hooks";
import { qs } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Input } from "@assistflow/shared/ui/input";
import { DataTable, fmtDate } from "@/components/common";

export default function UsersPage() {
  const [q, setQ] = React.useState(""); const [page, setPage] = React.useState(1);
  const { data, loading, error, refetch } = useApi<{ items: { id: string; name: string; email: string; phone: string; organizations: number; lastLoginAt?: string; createdAt: string }[]; total: number; page: number; limit: number }>(`/v1/admin/users${qs({ q, page, limit: 25 })}`);
  return <><PageHeader title="Client users" description={data ? `${data.total} accounts` : undefined} /><Input placeholder="Search name or email…" className="h-8 w-64" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
    <DataTable rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: "No users" }} page={data?.page} limit={data?.limit} total={data?.total} onPage={setPage} cols={[{ key: "n", label: "Name", render: (u) => <span className="font-medium">{u.name || "—"}</span> }, { key: "e", label: "Email", render: (u) => u.email }, { key: "p", label: "Phone", render: (u) => u.phone || "—" }, { key: "o", label: "Organizations", className: "text-right tabular", render: (u) => u.organizations }, { key: "l", label: "Last login", className: "text-xs text-muted-foreground", render: (u) => fmtDate(u.lastLoginAt) }, { key: "c", label: "Joined", className: "text-right text-xs text-muted-foreground", render: (u) => fmtDate(u.createdAt) }]} /></>;
}
