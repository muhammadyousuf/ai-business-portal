import Link from "next/link";
import { Check, CreditCard, Download } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Pill, StatusBadge } from "@assistflow/shared/components/pill";
import { UsageMeter } from "@assistflow/shared/components/mini-bars";
import { invoiceStatus } from "@assistflow/shared/lib/status";
import { businessBySlug, invoices, planByKey, plans } from "@assistflow/shared/mock/platform";
import { formatDate, fmtUsd } from "@assistflow/shared/lib/utils";

export default async function BillingPage({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params;
  const b = businessBySlug(slug)!;
  const plan = planByKey(b.plan);
  const mine = invoices.filter((i) => i.businessId === b.id);
  return (
    <>
      <PageHeader title="Billing" description="Your AssistFlow subscription. Separate from your customers' orders." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0"><div><CardTitle>Current plan: {plan.name}</CardTitle><CardDescription>{fmtUsd(plan.monthlyUsd)} per month · renews {formatDate(b.renewsAt, { year: "numeric" })} · PKR equivalent billed via bank transfer</CardDescription></div><Pill tone="success">Active</Pill></CardHeader>
          <CardContent className="space-y-4">
            <UsageMeter used={b.usage.aiReplies} limit={plan.aiReplies} label="AI replies this cycle" />
            <UsageMeter used={b.channels.length} limit={plan.channels} label="Channels" />
            <UsageMeter used={3} limit={plan.staffSeats} label="Staff seats" />
            <p className="text-xs text-muted-foreground">At 100% of AI replies the assistant answers from FAQs only and stops collecting orders until renewal or upgrade. You get a warning at 80%.</p>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Payment method</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p className="flex items-center gap-2"><CreditCard className="size-4 text-muted-foreground" /> Bank transfer (MCB) · manual</p><Button variant="outline" size="sm" className="w-full">Add card</Button><p className="text-xs text-muted-foreground">Cards are charged automatically on renewal. Bank transfers have a 7-day due window.</p></CardContent></Card>
      </div>
      <section>
        <h2 className="mb-3 text-sm font-semibold">Change plan</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {plans.map((p) => <Card key={p.key} className={p.key === b.plan ? "border-brand ring-1 ring-brand/30" : ""}><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">{p.name}</CardTitle>{p.key === b.plan ? <Pill tone="brand">Current</Pill> : null}</div><p className="text-2xl font-semibold tabular">{fmtUsd(p.monthlyUsd)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p><CardDescription>{p.aiReplies.toLocaleString()} replies · {p.channels} channels</CardDescription></CardHeader><CardContent><ul className="space-y-1.5">{p.features.slice(0, 3).map((f) => <li key={f} className="flex items-start gap-2 text-xs"><Check className="mt-0.5 size-3 shrink-0 text-success" />{f}</li>)}</ul><Button className="mt-4 w-full" size="sm" variant={p.key === b.plan ? "outline" : "default"} disabled={p.key === b.plan}>{p.key === b.plan ? "Current plan" : p.monthlyUsd > plan.monthlyUsd ? "Upgrade" : "Downgrade"}</Button></CardContent></Card>)}
        </div>
      </section>
      <Card><CardHeader><CardTitle>Invoices</CardTitle></CardHeader><CardContent className="divide-y">
        {mine.map((i) => <div key={i.id} className="flex items-center gap-3 py-2.5 text-sm"><span className="font-mono text-xs">{i.number}</span><span className="flex-1 text-muted-foreground">{i.period}</span><StatusBadge status={i.status} map={invoiceStatus} /><span className="tabular font-medium">{fmtUsd(i.amountUsd)}</span><Button variant="ghost" size="icon-sm" aria-label="Download"><Download /></Button></div>)}
        <p className="pt-3 text-xs text-muted-foreground">Questions about billing? <Link href="#" className="text-brand hover:underline">Open a support ticket</Link>.</p>
      </CardContent></Card>
    </>
  );
}
