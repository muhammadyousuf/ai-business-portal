"use client";
import * as React from "react";
import Link from "next/link";
import { useApi } from "@assistflow/shared/api/hooks";
import { qs } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { DataTable, Pill, fmtDate } from "@/components/common";

export default function ActivityPage() {
  const [page, setPage] = React.useState(1);
  const { data, loading, error, refetch } = useApi<{ items: { id: string; orgId?: string; organizationName: string; actorType: string; actorName: string; action: string; summary: string; createdAt: string }[]; total: number; page: number; limit: number }>(`/v1/admin/activity${qs({ page, limit: 50 })}`);
  return <><PageHeader title="Activity log" description="Every meaningful action across the platform: signups, changes, chatbot handovers, admin actions." />
    <DataTable rows={data?.items} loading={loading} error={error?.message} onRetry={refetch} empty={{ title: "No activity yet" }} page={data?.page} limit={data?.limit} total={data?.total} onPage={setPage} cols={[{ key: "t", label: "When", className: "whitespace-nowrap text-xs text-muted-foreground", render: (a) => fmtDate(a.createdAt) }, { key: "o", label: "Organization", render: (a) => (a.orgId ? <Link href={`/organizations/${a.orgId}`} className="hover:underline">{a.organizationName || a.orgId}</Link> : <span className="text-muted-foreground">Platform</span>) }, { key: "s", label: "Event", render: (a) => a.summary }, { key: "a", label: "Actor", render: (a) => <Pill>{a.actorType}</Pill> }, { key: "k", label: "Action", className: "font-mono text-[11px] text-muted-foreground", render: (a) => a.action }]} /></>;
}
