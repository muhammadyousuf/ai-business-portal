import { botDemoUrl } from "@/lib/links";
import Link from "next/link";
import { ArrowUpRight, Bot, Clock, Inbox, ShoppingCart, UserRound, Wallet } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { KpiCard } from "@assistflow/shared/dashboard/kpi-card";
import { MiniBars } from "@assistflow/shared/components/mini-bars";
import { ChannelBadge } from "@assistflow/shared/components/channel-badge";
import { StatusBadge } from "@assistflow/shared/components/pill";
import { OrderCard } from "@/components/business/order-card";
import { ActivityFeed } from "@assistflow/shared/dashboard/activity-feed";
import { conversationStatus } from "@assistflow/shared/lib/status";
import { businessActivity, businessKpis, conversations, customerById, dailyOrders, fmtPKR, orders, topQuestions } from "@assistflow/shared/mock/business";
import { relativeTime } from "@assistflow/shared/lib/utils";

export default async function BusinessDashboard({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params;
  const base = `/${slug}`;
  const pending = orders.filter((o) => o.status === "pending");
  const attention = conversations.filter((c) => c.status === "needs_attention" || c.status === "ai");
  return (
    <>
      <PageHeader title="Good afternoon, Imran" description="Friday, 31 October · 2 order requests waiting for your confirmation call" actions={<><Button variant="outline" size="sm" asChild><Link href={botDemoUrl(slug)}>View your website widget</Link></Button><Button size="sm" asChild><Link href={`${base}/orders`}>Manual order</Link></Button></>} />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Pending confirmation" value={businessKpis.pendingOrders} delta="call the customer" icon={ShoppingCart} tone="warning" />
        <KpiCard label="Orders (30d)" value={businessKpis.orders30d} delta="+18% vs Sept" icon={ShoppingCart} />
        <KpiCard label="Order value (30d)" value={fmtPKR(businessKpis.revenue30d)} delta="avg Rs. 1,158" icon={Wallet} tone="brand" />
        <KpiCard label="Conversations (30d)" value={businessKpis.conversations30d} delta="website 56% · WhatsApp 44%" icon={Inbox} />
        <KpiCard label="AI resolved" value={`${businessKpis.aiResolvedPct}%`} delta={`${businessKpis.handovers30d} handed to staff`} icon={Bot} />
        <KpiCard label="Avg first reply" value={`${businessKpis.avgResponseSecs}s`} delta="was ~25 min before" icon={Clock} />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Order requests to confirm</h2><Link href={`${base}/orders`} className="text-xs font-medium text-brand hover:underline">All orders</Link></div>
          {pending.map((o) => <OrderCard key={o.id} order={o} base={base} />)}
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Inbox</CardTitle><CardDescription>Live and waiting conversations.</CardDescription></div><Link href={`${base}/inbox`} className="text-xs font-medium text-brand hover:underline">Open inbox</Link></CardHeader>
            <CardContent className="space-y-1">
              {attention.map((c) => (
                <Link key={c.id} href={`${base}/inbox/${c.id}`} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
                  <ChannelBadge channel={c.channel} withLabel={false} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{customerById(c.customerId)?.name}</p><p className="truncate text-xs text-muted-foreground">{c.preview}</p></div>
                  <StatusBadge status={c.status} map={conversationStatus} />
                  <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </Link>
              ))}
              {conversations.filter((c) => c.status === "human").map((c) => (
                <Link key={c.id} href={`${base}/inbox/${c.id}`} className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
                  <ChannelBadge channel={c.channel} withLabel={false} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{customerById(c.customerId)?.name}</p><p className="truncate text-xs text-muted-foreground">{c.preview}</p></div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><UserRound className="size-3" /> Ayesha</span>
                </Link>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Orders this week</CardTitle><CardDescription>Friday is still early.</CardDescription></CardHeader>
            <CardContent><MiniBars data={dailyOrders.map((d) => ({ label: d.day.split(" ")[0], value: d.orders }))} className="h-24" highlightLast /></CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3"><ActivityFeed items={businessActivity} base={base} /></div>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>What customers ask most</CardTitle><CardDescription>Last 30 days. Add FAQs for anything the AI struggles with.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {topQuestions.map((q) => <div key={q.q} className="flex items-center justify-between gap-3 text-sm"><span className="truncate">{q.q}</span><span className="shrink-0 tabular text-xs text-muted-foreground">{q.n}</span></div>)}
            <p className="pt-2 text-[11px] text-muted-foreground">Last unanswered: &ldquo;Do you have a vegetarian biryani?&rdquo; · {relativeTime("2026-10-31T10:15:00Z")}</p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
