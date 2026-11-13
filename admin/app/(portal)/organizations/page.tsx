"use client";
import * as React from "react";
import Link from "next/link";
import { useApi } from "@assistflow/shared/api/hooks";
import { qs } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Input } from "@assistflow/shared/ui/input";
import { Select } from "@assistflow/shared/ui/select";
import { BrandMark } from "@assistflow/shared/components/brand-mark";
import { organizationStatus } from "@assistflow/shared/lib/status";
import { DataTable, Pill, Status, fmtDate } from "@/components/common";

interface Org { id: string; uuid: string; name: string; categoryKey: string; categoryName: string; status: string; owner: { name: string; email: string } | null; memberCount: number; conversationCount: number; orderCount: number; createdAt: string }

export default function OrganizationsPage() {
  const [q, setQ] = React.useState(""); const [status, setStatus] = React.useState(""); const [categoryKey, setCategoryKey] = React.useState(""); const [page, setPage] = React.useState(1);
  const cats = useApi<{ items: { key: string; name: string }[] }>("/v1/admin/categories");
  const { data, loading, error, refetch } = useApi<{ items: Org[]; total: number; page: number; limit: number }>(`/v1/admin/organizations${qs({ q, status, categoryKey, page, limit: 25 })}`);
  return (
    <>
      <PageHeader title="Organizations" description={data ? `${data.total} registered` : undefined} />
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search name, email or slug…" className="h-8 w-64" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select className="h-8 w-44" value={categoryKey} onChange={(e) => { setCategoryKey(e.target.value); setPage(1); }}><option value="">All categories</option>{cats.data?.items.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}</Select>
        <Select className="h-8 w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="deleted">Deleted</option></Select>
      </div>
      <DataTable<Org> rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: "No organizations match", description: "Organizations appear here as businesses sign up on the client portal." }} page={data?.page} limit={data?.limit} total={data?.total} onPage={setPage}
        cols={[
          { key: "name", label: "Organization", render: (o) => <Link href={`/organizations/${o.uuid}`} className="flex items-center gap-2.5"><BrandMark text={o.name.slice(0, 1).toUpperCase()} className="size-7 text-xs" /><div className="min-w-0"><p className="truncate font-medium hover:underline">{o.name}</p><p className="truncate text-[11px] text-muted-foreground">{o.owner?.email}</p></div></Link> },
          { key: "cat", label: "Category", render: (o) => <Pill tone="brand">{o.categoryName}</Pill> },
          { key: "status", label: "Status", render: (o) => <Status value={o.status} map={organizationStatus} /> },
          { key: "members", label: "Members", className: "text-right tabular", render: (o) => o.memberCount },
          { key: "conv", label: "Conversations", className: "text-right tabular hidden md:table-cell", render: (o) => o.conversationCount },
          { key: "orders", label: "Orders", className: "text-right tabular hidden md:table-cell", render: (o) => o.orderCount },
          { key: "created", label: "Joined", className: "text-right text-xs text-muted-foreground", render: (o) => fmtDate(o.createdAt) },
        ]} />
    </>
  );
}
