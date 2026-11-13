"use client";
import Link from "next/link";
import { Building2, Inbox, MessageSquareWarning, ShoppingCart, Users, CalendarCheck } from "lucide-react";
import { useApi } from "@assistflow/shared/api/hooks";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { KpiCard } from "@assistflow/shared/dashboard/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { MiniBars } from "@assistflow/shared/components/mini-bars";
import { BrandMark } from "@assistflow/shared/components/brand-mark";
import { organizationStatus } from "@assistflow/shared/lib/status";
import { Loading, ErrorState, Status, relativeTime } from "@/components/common";

interface Dash { counts: Record<string, number>; byCategory: { key: string; name: string; count: number }[]; recentActivity: { id: string; actorName: string; action: string; summary: string; createdAt: string }[]; recentOrganizations: { uuid: string; name: string; categoryKey: string; status: string; createdAt: string }[] }

export default function Dashboard() {
  const { data, loading, error, refetch } = useApi<Dash>("/v1/admin/dashboard");
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (loading || !data) return <Loading />;
  const c = data.counts;
  return (
    <>
      <PageHeader title="Platform overview" description={`${c.active} active organizations · ${c.users} users · ${c.needsHuman} conversations waiting for a human`} />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Organizations" value={c.organizations} delta={`+${c.newOrgs7d} this week`} icon={Building2} tone="brand" />
        <KpiCard label="Users" value={c.users} icon={Users} />
        <KpiCard label="Conversations" value={c.conversations} delta={`+${c.conversations7d} this week`} icon={Inbox} />
        <KpiCard label="Needs a human" value={c.needsHuman} icon={MessageSquareWarning} tone={c.needsHuman ? "warning" : "default"} />
        <KpiCard label="Orders" value={c.orders} delta={`+${c.orders7d} this week`} icon={ShoppingCart} />
        <KpiCard label="Appointments + inquiries" value={c.appointments + c.inquiries} icon={CalendarCheck} />
      </section>
      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Organizations by category</CardTitle></CardHeader><CardContent>{data.byCategory.length ? <MiniBars data={data.byCategory.map((b) => ({ label: b.name, value: b.count }))} /> : <p className="py-8 text-center text-xs text-muted-foreground">No organizations yet.</p>}</CardContent></Card>
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Newest organizations</CardTitle><CardDescription>Most recent signups.</CardDescription></div><Link href="/organizations" className="text-xs font-medium text-brand hover:underline">View all</Link></CardHeader>
          <CardContent className="divide-y">
            {data.recentOrganizations.map((o) => <Link key={o.uuid} href={`/organizations/${o.uuid}`} className="flex items-center gap-3 py-2.5 hover:bg-accent/50"><BrandMark text={o.name.slice(0, 1).toUpperCase()} className="size-7 text-xs" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{o.name}</p><p className="text-[11px] text-muted-foreground">{o.categoryKey} · {relativeTime(o.createdAt, new Date())}</p></div><Status value={o.status} map={organizationStatus} /></Link>)}
            {!data.recentOrganizations.length ? <p className="py-6 text-center text-xs text-muted-foreground">No organizations yet.</p> : null}
          </CardContent>
        </Card>
      </section>
      <Card><CardHeader><CardTitle>Platform activity</CardTitle></CardHeader><CardContent className="divide-y">
        {data.recentActivity.map((a) => <div key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{a.summary}</span><span className="shrink-0 text-xs text-muted-foreground">{relativeTime(a.createdAt, new Date())}</span></div>)}
        {!data.recentActivity.length ? <p className="py-6 text-center text-xs text-muted-foreground">Nothing yet.</p> : null}
      </CardContent></Card>
    </>
  );
}
