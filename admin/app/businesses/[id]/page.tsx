import { userAppUrl } from "@/lib/links";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Eye, Mail, Pause, Play, Receipt, ShieldAlert } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@assistflow/shared/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { BrandMark } from "@assistflow/shared/components/brand-mark";
import { ChannelBadge } from "@assistflow/shared/components/channel-badge";
import { Pill, StatusBadge } from "@assistflow/shared/components/pill";
import { UsageMeter } from "@assistflow/shared/components/mini-bars";
import { KpiCard } from "@assistflow/shared/dashboard/kpi-card";
import { Inbox, ShoppingCart, Sparkles, Wallet } from "lucide-react";
import { businessStatus, invoiceStatus, paymentStatus, conversationStatus, orderStatus } from "@assistflow/shared/lib/status";
import { businessById, industryLabel, invoices, payments, planByKey, auditLog } from "@assistflow/shared/mock/platform";
import { conversations, orders, customerById, fmtPKR } from "@assistflow/shared/mock/business";
import { formatDate, fmtNum, fmtUsd, relativeTime } from "@assistflow/shared/lib/utils";

export default async function BusinessDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = businessById(id);
  if (!b) notFound();
  const plan = planByKey(b.plan);
  const bInvoices = invoices.filter((i) => i.businessId === b.id);
  const bPayments = payments.filter((p) => p.businessId === b.id);
  const isDemo = b.id === "b_karachi";
  const bAudit = auditLog.filter((a) => a.target.includes(b.name.split(" ")[0]));

  return (
    <>
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/businesses" className="hover:text-foreground">Businesses</Link><ChevronRight className="size-3" /><span className="text-foreground">{b.name}</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <BrandMark text={b.branding.logoText} className="size-12 text-lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{b.name}</h1>
              <StatusBadge status={b.status} map={businessStatus} />
              <Pill tone="brand">{plan.name} · {fmtUsd(plan.monthlyUsd)}/mo</Pill>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{industryLabel[b.industry]} · {b.city}, {b.country} · Registered {formatDate(b.registeredAt, { year: "numeric" })} · Renews {formatDate(b.renewsAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild><a href={userAppUrl(b.slug)} target="_blank" rel="noreferrer"><Eye /> Open portal (audited)</a></Button>
          <Button variant="outline" size="sm"><Mail /> Email owner</Button>
          <Button variant="outline" size="sm"><Receipt /> Create invoice</Button>
          {b.status === "suspended" ? <Button size="sm"><Play /> Reactivate</Button> : <Button variant="destructive" size="sm"><Pause /> Suspend</Button>}
        </div>
      </div>

      {b.status === "suspended" ? (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 text-destructive" />
          <div><p className="font-medium">Suspended for non-payment on 31 Oct.</p><p className="text-muted-foreground">Invoice AF-2026-0044 ($99) is 19 days overdue after 3 failed card attempts. The AI assistant is paused and the owner sees a payment banner. Grace period was 14 days.</p></div>
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="Conversations (30d)" value={fmtNum(b.usage.conversations)} icon={Inbox} />
        <KpiCard label="Orders / inquiries (30d)" value={fmtNum(b.usage.orders)} icon={ShoppingCart} />
        <KpiCard label="AI replies this cycle" value={`${fmtNum(b.usage.aiReplies)}`} delta={`of ${fmtNum(plan.aiReplies)} · ≈ ${fmtUsd(Math.round(b.usage.aiReplies * 0.0042 * 100) / 100)} cost`} icon={Sparkles} tone="brand" />
        <KpiCard label="Lifetime billed" value={fmtUsd(bInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amountUsd, 0) + plan.monthlyUsd * 2)} delta={b.mrrUsd ? `${fmtUsd(b.mrrUsd)} MRR` : "No active subscription"} icon={Wallet} />
      </section>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing ({bInvoices.length})</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Account</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Field label="Owner" value={b.owner.name} /><Field label="Email" value={b.owner.email} />
                <Field label="Phone" value={b.owner.phone} /><Field label="Currency for customers" value={b.currency} />
                <Field label="Portal URL" value={`app.assistflow.app/${b.slug}`} /><Field label="Business ID" value={b.id} mono />
                <div className="space-y-1 sm:col-span-2"><dt className="text-xs text-muted-foreground">Connected channels</dt><dd className="flex gap-1.5">{b.channels.map((c) => <ChannelBadge key={c} channel={c} />)}<span className="text-xs text-muted-foreground">({b.channels.length} of {plan.channels} allowed)</span></dd></div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Plan usage</CardTitle><CardDescription>Cycle {formatDate(b.renewsAt, { month: "short" })} renewal.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <UsageMeter used={b.usage.aiReplies} limit={plan.aiReplies} label="AI replies" />
              <UsageMeter used={b.channels.length} limit={plan.channels} label="Channels" />
              <UsageMeter used={b.id === "b_karachi" ? 3 : 1} limit={plan.staffSeats} label="Staff seats" />
              <div className="flex gap-2 pt-1"><Button size="sm" variant="outline" className="flex-1">Change plan</Button><Button size="sm" variant="outline" className="flex-1">Extend cycle</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Number</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="pr-5 text-right">Due</TableHead></TableRow></TableHeader>
                <TableBody>
                  {bInvoices.map((i) => (
                    <TableRow key={i.id}><TableCell className="pl-5 font-medium"><Link href={`/invoices/${i.id}`} className="hover:underline">{i.number}</Link></TableCell><TableCell className="text-muted-foreground">{i.period}</TableCell><TableCell><StatusBadge status={i.status} map={invoiceStatus} /></TableCell><TableCell className="text-right tabular">{fmtUsd(i.amountUsd)}</TableCell><TableCell className="pr-5 text-right text-xs text-muted-foreground">{formatDate(i.dueAt)}</TableCell></TableRow>
                  ))}
                  {bInvoices.length === 0 ? <TableRow><TableCell colSpan={5} className="py-6 text-center text-xs text-muted-foreground">No invoices yet.</TableCell></TableRow> : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Reference</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="pr-5 text-right">Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {bPayments.map((p) => (
                    <TableRow key={p.id}><TableCell className="pl-5 font-mono text-xs">{p.reference}</TableCell><TableCell className="capitalize text-muted-foreground">{p.method.replace("_", " ")}</TableCell><TableCell><StatusBadge status={p.status} map={paymentStatus} /></TableCell><TableCell className="text-right tabular">{fmtUsd(p.amountUsd)}</TableCell><TableCell className="pr-5 text-right text-xs text-muted-foreground">{formatDate(p.at)}</TableCell></TableRow>
                  ))}
                  {bPayments.length === 0 ? <TableRow><TableCell colSpan={5} className="py-6 text-center text-xs text-muted-foreground">No payments recorded.</TableCell></TableRow> : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card>
            <CardHeader><CardTitle>Recent conversations</CardTitle><CardDescription>Read-only, role-gated and logged in the audit trail. Customer phone numbers are masked for support staff.</CardDescription></CardHeader>
            <CardContent className="p-0">
              {isDemo ? (
                <Table>
                  <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Customer</TableHead><TableHead>Channel</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Last message</TableHead><TableHead className="pr-5 text-right">When</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {conversations.map((c) => (
                      <TableRow key={c.id}><TableCell className="pl-5 font-medium">{customerById(c.customerId)?.name}</TableCell><TableCell><ChannelBadge channel={c.channel} /></TableCell><TableCell><StatusBadge status={c.status} map={conversationStatus} /></TableCell><TableCell className="hidden max-w-sm truncate text-muted-foreground md:table-cell">{c.preview}</TableCell><TableCell className="pr-5 text-right text-xs text-muted-foreground">{relativeTime(c.lastMessageAt)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="p-6 text-center text-xs text-muted-foreground">Conversation detail is only seeded for the demo business (Karachi Biryani House).</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle>Recent orders and inquiries</CardTitle><CardDescription>Order values belong to the business. They are separate from platform revenue.</CardDescription></CardHeader>
            <CardContent className="p-0">
              {isDemo ? (
                <Table>
                  <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Order</TableHead><TableHead>Customer</TableHead><TableHead>Channel</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="pr-5 text-right">Placed</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}><TableCell className="pl-5 font-medium">{o.number}</TableCell><TableCell>{customerById(o.customerId)?.name}</TableCell><TableCell><ChannelBadge channel={o.channel} /></TableCell><TableCell><StatusBadge status={o.status} map={orderStatus} /></TableCell><TableCell className="text-right tabular">{fmtPKR(o.total)}</TableCell><TableCell className="pr-5 text-right text-xs text-muted-foreground">{relativeTime(o.placedAt)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="p-6 text-center text-xs text-muted-foreground">Order detail is only seeded for the demo business (Karachi Biryani House).</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader><CardTitle>Audit trail for this business</CardTitle></CardHeader>
            <CardContent>
              {bAudit.length ? <ul className="divide-y text-sm">{bAudit.map((a) => <li key={a.id} className="flex items-center justify-between gap-3 py-2"><span><span className="font-medium">{a.actor}</span> <span className="text-muted-foreground">{a.action}</span> {a.target}</span><span className="shrink-0 text-xs text-muted-foreground">{relativeTime(a.at)}</span></li>)}</ul> : <p className="text-xs text-muted-foreground">No admin actions recorded for this business.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div className="space-y-1"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={mono ? "font-mono text-xs" : "text-sm"}>{value}</dd></div>;
}
