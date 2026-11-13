"use client";
import Link from "next/link";
import { BookOpen, Check, Circle, Inbox, MessageSquareWarning, Package, ShoppingCart, CalendarCheck, Users, Globe } from "lucide-react";
import { useApi } from "@assistflow/shared/api/hooks";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { KpiCard } from "@assistflow/shared/dashboard/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Loading } from "@assistflow/shared/components/states";
import { relativeTime } from "@assistflow/shared/lib/utils";
import { useOrg } from "@/lib/org-context";
import { useUser } from "@/lib/user-context";

export default function OrgDashboard() {
  const { me } = useUser(); const { org, base, has, label } = useOrg();
  const { data, loading } = useApi<{ counts: Record<string, number>; recentActivity: { id: string; summary: string; createdAt: string }[]; checklist: Record<string, boolean> }>(`/v1/orgs/${org.uuid}/dashboard`);
  if (loading || !data) return <Loading />;
  const c = data.counts; const ck = data.checklist;
  const steps = [
    { done: ck.profile, label: "Complete your organization profile", href: `${base}/settings` },
    { done: ck.qa, label: "Add questions and answers for the chatbot", href: `${base}/chatbot` },
    ...(has("catalog") ? [{ done: ck.catalog, label: `Add your ${label("catalogItem", "items").toLowerCase()}s and prices`, href: `${base}/catalog` }] : []),
    { done: ck.widgetOrigin, label: "Install the chatbot on your website", href: `${base}/chatbot?tab=install` },
  ];
  return (
    <>
      <PageHeader title={`Hello, ${me.name?.split(" ")[0] || "there"}`} description={`${org.name} · ${c.needsHuman ? `${c.needsHuman} conversation${c.needsHuman > 1 ? "s" : ""} waiting for a human` : "All conversations handled"}`} />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Conversations" value={c.conversations} icon={Inbox} />
        <KpiCard label="Needs a human" value={c.needsHuman} icon={MessageSquareWarning} tone={c.needsHuman ? "warning" : "default"} />
        {has("orders") ? <KpiCard label="Open orders" value={c.openOrders} delta={`${c.orders7d} this week`} icon={ShoppingCart} tone="brand" /> : null}
        {has("appointments") ? <KpiCard label={`${label("appointment", "Appointment")} requests`} value={c.appointmentsRequested} icon={CalendarCheck} /> : null}
        {has("inquiries") ? <KpiCard label="New inquiries" value={c.inquiriesNew} icon={BookOpen} /> : null}
        <KpiCard label="Q&A entries" value={c.qas} icon={BookOpen} />
        {has("catalog") ? <KpiCard label={`${label("catalogItem", "Item")}s`} value={c.catalogItems} icon={Package} /> : null}
        <KpiCard label="Team members" value={c.members} icon={Users} />
      </section>
      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2"><CardHeader><CardTitle>Getting started</CardTitle><CardDescription>{steps.filter((s) => s.done).length} of {steps.length} done</CardDescription></CardHeader>
          <CardContent className="space-y-1">{steps.map((s) => <Link key={s.label} href={s.href} className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent">{s.done ? <Check className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground" />}<span className={s.done ? "text-muted-foreground line-through" : ""}>{s.label}</span></Link>)}
            <div className="mt-3 rounded-md bg-muted p-3 text-xs text-muted-foreground"><Globe className="mr-1 inline size-3" /> Your widget key: <span className="font-mono">{org.widgetKey}</span></div></CardContent></Card>
        <Card className="lg:col-span-3"><CardHeader><CardTitle>Recent activity</CardTitle></CardHeader><CardContent className="divide-y">{data.recentActivity.length ? data.recentActivity.map((a) => <div key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span>{a.summary}</span><span className="shrink-0 text-xs text-muted-foreground">{relativeTime(a.createdAt, new Date())}</span></div>) : <p className="py-6 text-center text-xs text-muted-foreground">Activity will appear here as your team and customers use the chatbot.</p>}</CardContent></Card>
      </section>
    </>
  );
}
