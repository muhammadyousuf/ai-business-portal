import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Bot, Building2, DollarSign, Inbox, ShoppingCart, Sparkles, Wallet } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { KpiCard } from "@assistflow/shared/dashboard/kpi-card";
import { MiniBars } from "@assistflow/shared/components/mini-bars";
import { StatusBadge, Pill } from "@assistflow/shared/components/pill";
import { BrandMark } from "@assistflow/shared/components/brand-mark";
import { ActivityFeed } from "@assistflow/shared/dashboard/activity-feed";
import { businessStatus } from "@assistflow/shared/lib/status";
import { businesses, industryLabel, mrrHistory, planByKey, platformKpis, tickets, usage30d, businessById } from "@assistflow/shared/mock/platform";
import { fmtNum, fmtUsd, relativeTime } from "@assistflow/shared/lib/utils";

const attention = [
  { id: "a1", title: "Electric World: payment overdue 19 days, now suspended", detail: "Pro plan · $99 · card failed 3 times", href: "/businesses/b_electric", tone: "destructive" as const },
  { id: "a2", title: "City Grammar School trial ends in 3 days", detail: "143 AI replies used · 2 channels connected · no payment method", href: "/businesses/b_city", tone: "warning" as const },
  { id: "a3", title: "Spice Route Kitchen: Instagram DMs not arriving", detail: "Ticket tk_3 · high priority · opened 2 days ago", href: "/support", tone: "warning" as const },
  { id: "a4", title: "Karachi Biryani House at 68% of AI reply limit", detail: "684 / 1,000 this cycle · suggest Pro upgrade", href: "/businesses/b_karachi", tone: "info" as const },
];

const activity = [
  { id: "x1", actor: "System", action: "auto-suspended", target: "Electric World (overdue)", href: "businesses/b_electric", at: "2026-10-31T07:10:00Z", kind: "billing" as const },
  { id: "x2", actor: "Invoice generator", action: "issued", target: "AF-2026-0046 to Sweet Crumbs Bakery", href: "invoices/inv_6", at: "2026-10-30T00:00:00Z", kind: "billing" as const },
  { id: "x3", actor: "City Grammar School", action: "opened ticket", target: "fee structure per class", href: "support", at: "2026-10-30T09:20:00Z", kind: "system" as const },
  { id: "x4", actor: "Yousuf", action: "extended trial", target: "City Grammar School +7 days", href: "audit", at: "2026-10-29T16:30:00Z", kind: "system" as const },
  { id: "x5", actor: "Lotus Dental Clinic", action: "connected", target: "Instagram channel", href: "businesses/b_lotus", at: "2026-10-28T11:00:00Z", kind: "conversation" as const },
  { id: "x6", actor: "Urban Threads", action: "paid", target: "AF-2026-0043 ($49)", href: "revenue", at: "2026-10-18T02:03:00Z", kind: "billing" as const },
];

export default function AdminDashboard() {
  const last7 = usage30d.slice(-7);
  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Friday, 31 October · 6 active businesses · 1 trial ending soon"
        actions={<><Button variant="outline" size="sm" asChild><Link href="/reports">Reports</Link></Button><Button size="sm" asChild><Link href="/businesses">+ Register business</Link></Button></>}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Monthly recurring revenue" value={fmtUsd(platformKpis.mrr)} delta="−$19 vs Sept (1 churn)" icon={DollarSign} tone="brand" />
        <KpiCard label="Active businesses" value={platformKpis.active} delta={`${platformKpis.trial} on trial · ${platformKpis.businesses} total`} icon={Building2} />
        <KpiCard label="Outstanding" value={fmtUsd(platformKpis.outstanding)} delta="1 overdue, 2 due" icon={Wallet} tone="warning" />
        <KpiCard label="Conversations (30d)" value={fmtNum(platformKpis.conversations30d)} delta="across all businesses" icon={Inbox} />
        <KpiCard label="Orders collected (30d)" value={fmtNum(platformKpis.orders30d)} delta="by AI assistants" icon={ShoppingCart} />
        <KpiCard label="AI cost (30d)" value={fmtUsd(platformKpis.aiCost30d)} delta={`${fmtNum(platformKpis.aiReplies30d)} replies · ${Math.round((platformKpis.aiCost30d / platformKpis.mrr) * 100)}% of MRR`} icon={Bot} />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div><CardTitle>Needs your attention</CardTitle><CardDescription>Billing, trials and support items that affect revenue.</CardDescription></div>
            <Pill tone="warning"><AlertTriangle className="size-3" /> {attention.length}</Pill>
          </CardHeader>
          <CardContent className="space-y-1">
            {attention.map((a) => (
              <Link key={a.id} href={a.href} className="group flex items-start gap-3 rounded-md px-2 py-2 hover:bg-accent">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${a.tone === "destructive" ? "bg-destructive" : a.tone === "warning" ? "bg-warning" : "bg-info"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>MRR by month</CardTitle><CardDescription>Gross subscription revenue, USD.</CardDescription></CardHeader>
          <CardContent><MiniBars data={mrrHistory.map((m) => ({ label: m.month, value: m.mrr }))} format={fmtUsd} highlightLast /></CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div><CardTitle>Businesses</CardTitle><CardDescription>Most active first.</CardDescription></div>
            <Link href="/businesses" className="text-xs font-medium text-brand hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="divide-y">
            {[...businesses].sort((a, b) => b.usage.conversations - a.usage.conversations).slice(0, 6).map((b) => (
              <Link key={b.id} href={`/businesses/${b.id}`} className="flex items-center gap-3 py-2.5 hover:bg-accent/50">
                <BrandMark text={b.branding.logoText} className="size-7 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  <p className="text-[11px] text-muted-foreground">{industryLabel[b.industry]} · {b.city}, {b.country}</p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:inline">{fmtNum(b.usage.conversations)} conv · {b.usage.orders} orders</span>
                <Pill tone="brand">{planByKey(b.plan).name}</Pill>
                <StatusBadge status={b.status} map={businessStatus} />
              </Link>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-brand" /> AI replies, last 7 days</CardTitle></CardHeader>
            <CardContent><MiniBars data={last7.map((d) => ({ label: d.date.slice(8), value: d.aiReplies }))} className="h-24" /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Open tickets</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {tickets.filter((t) => t.status !== "resolved").map((t) => (
                <div key={t.id} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0"><p className="truncate font-medium">{t.subject}</p><p className="text-[11px] text-muted-foreground">{businessById(t.businessId)?.name} · {relativeTime(t.openedAt)}</p></div>
                  <Pill tone={t.priority === "high" ? "destructive" : "neutral"}>{t.priority}</Pill>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <ActivityFeed items={activity} base="" title="Platform activity" />
    </>
  );
}
