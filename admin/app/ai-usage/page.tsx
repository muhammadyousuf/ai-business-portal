import { Bot, Clock, DollarSign, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { KpiCard } from "@assistflow/shared/dashboard/kpi-card";
import { MiniBars, UsageMeter } from "@assistflow/shared/components/mini-bars";
import { Pill } from "@assistflow/shared/components/pill";
import { businesses, planByKey, platformKpis, usage30d } from "@assistflow/shared/mock/platform";
import { fmtNum, fmtUsd } from "@assistflow/shared/lib/utils";

const failures = [
  { business: "Urban Threads", question: "Return without receipt, bought as gift", reason: "Policy not in knowledge base", at: "Today" },
  { business: "Karachi Biryani House", question: "Deliver to DHA for a 20-person order?", reason: "Delivery exception, handed over", at: "Yesterday" },
  { business: "Spice Route Kitchen", question: "Can I pay with Klarna?", reason: "Unknown payment method", at: "Yesterday" },
  { business: "City Grammar School", question: "Fee concession for siblings?", reason: "Low confidence (0.44)", at: "2 days ago" },
];

export default function AiUsagePage() {
  const margin = Math.round((1 - platformKpis.aiCost30d / platformKpis.mrr) * 100);
  return (
    <>
      <PageHeader title="AI usage & monitoring" description="Tokens, cost, confidence and failures per business. This is where margin is protected." />
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="AI replies (30d)" value={fmtNum(platformKpis.aiReplies30d)} delta="1 reply = 1 customer message answered" icon={Bot} tone="brand" />
        <KpiCard label="AI API cost (30d)" value={fmtUsd(platformKpis.aiCost30d)} delta={`≈ $${(platformKpis.aiCost30d / platformKpis.aiReplies30d).toFixed(4)} per reply`} icon={DollarSign} />
        <KpiCard label="Gross margin after AI" value={`${margin}%`} delta="before hosting and WhatsApp fees" icon={DollarSign} tone={margin < 70 ? "warning" : "default"} />
        <KpiCard label="Avg response time" value="3.8s" delta="p95 7.1s" icon={Clock} />
      </section>
      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3"><CardHeader><CardTitle>Daily AI replies, last 30 days</CardTitle><CardDescription>Weekends peak for restaurants and bakeries.</CardDescription></CardHeader><CardContent><MiniBars data={usage30d.map((d) => ({ label: d.date.slice(8), value: d.aiReplies }))} className="h-40 gap-0.5" /></CardContent></Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Model mix</CardTitle><CardDescription>Cheapest capable model per task.</CardDescription></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[["FAQ and price lookups", "small model", 71, 0.0012], ["Order collection", "small model + tools", 19, 0.0038], ["Complaints and edge cases", "mid model", 8, 0.011], ["Business analyst questions", "mid model", 2, 0.019]].map(([t, m, pct, c]) => (
              <div key={t as string} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{t}</p><p className="text-[11px] text-muted-foreground">{m} · ≈ ${c}/reply</p></div><Pill>{pct}%</Pill></div>
            ))}
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Usage against plan limits</CardTitle><CardDescription>Businesses above 80% get an upgrade nudge; at 100% the assistant degrades to FAQ-only.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {businesses.filter((b) => b.status === "active" || b.status === "trial").sort((a, b) => b.usage.aiReplies / planByKey(b.plan).aiReplies - a.usage.aiReplies / planByKey(a.plan).aiReplies).map((b) => (
              <UsageMeter key={b.id} used={b.usage.aiReplies} limit={planByKey(b.plan).aiReplies} label={`${b.name} · ${planByKey(b.plan).name}`} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ThumbsDown className="size-4 text-muted-foreground" /> Failed or low-confidence answers</CardTitle><CardDescription>Each one is a knowledge-base gap or a product rule to add.</CardDescription></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Business</TableHead><TableHead>Question</TableHead><TableHead className="pr-5">Reason</TableHead></TableRow></TableHeader>
              <TableBody>{failures.map((f, i) => <TableRow key={i}><TableCell className="pl-5 font-medium">{f.business}</TableCell><TableCell className="max-w-[14rem] truncate">{f.question}</TableCell><TableCell className="pr-5 text-xs text-muted-foreground">{f.reason}</TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
