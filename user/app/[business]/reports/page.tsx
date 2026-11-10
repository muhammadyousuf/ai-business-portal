import { Download, Sparkles } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Input } from "@assistflow/shared/ui/input";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { MiniBars } from "@assistflow/shared/components/mini-bars";
import { businessKpis, dailyOrders, fmtPKR, products, topQuestions } from "@assistflow/shared/mock/business";

export default function ReportsPage() {
  const top = [["Chicken Biryani", 61], ["Chicken Karahi", 24], ["Beef Biryani", 22], ["Chicken Tikka", 19], ["Family Biryani", 14]];
  return (
    <>
      <PageHeader title="Reports" description="Last 30 days unless stated. Order value is yours; it has nothing to do with your AssistFlow subscription." actions={<><Button variant="outline" size="sm"><Download /> CSV</Button><Button variant="outline" size="sm"><Download /> PDF</Button></>} />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Orders", String(businessKpis.orders30d)], ["Order value", fmtPKR(businessKpis.revenue30d)], ["Conversations → orders", "38%"], ["AI resolved", `${businessKpis.aiResolvedPct}%`], ["Handovers", String(businessKpis.handovers30d)], ["Unanswered", String(businessKpis.unanswered30d)], ["Avg reply", `${businessKpis.avgResponseSecs}s`], ["Repeat customers", "46%"]].map(([k, v]) => <Card key={k} className="p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-xl font-semibold tabular">{v}</p></Card>)}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Orders per day</CardTitle></CardHeader><CardContent><MiniBars data={dailyOrders.map((d) => ({ label: d.day, value: d.orders }))} highlightLast /></CardContent></Card>
        <Card><CardHeader><CardTitle>Order value per day</CardTitle></CardHeader><CardContent><MiniBars data={dailyOrders.map((d) => ({ label: d.day, value: d.revenue }))} format={fmtPKR} highlightLast /></CardContent></Card>
        <Card><CardHeader><CardTitle>Top items</CardTitle></CardHeader><CardContent className="space-y-2">{top.map(([n, v]) => <div key={n as string}><div className="flex justify-between text-sm"><span>{n as string}</span><span className="tabular text-muted-foreground">{v as number} orders</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${((v as number) / 61) * 100}%` }} /></div></div>)}<p className="pt-1 text-[11px] text-muted-foreground">{products.filter((p) => !p.available).length} item currently unavailable: lost ~6 asks this week.</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Channel split</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{[["Website", 56, 174], ["WhatsApp", 44, 138]].map(([c, pct, n]) => <div key={c as string}><div className="flex justify-between"><span>{c as string}</span><span className="tabular text-muted-foreground">{n as number} conversations · {pct as number}%</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div></div>)}<p className="pt-1 text-xs text-muted-foreground">WhatsApp converts better (44% vs 33%) but has more complaints.</p></CardContent></Card>
      </section>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-brand" /> Ask about your business</CardTitle><CardDescription>Answers come from your recorded orders and conversations, with the numbers shown.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2"><Input defaultValue="Which products had the most orders this month, and which area orders most?" /><Button>Ask</Button></div>
          <div className="rounded-lg bg-muted p-3 text-sm"><p>Chicken Biryani led with 61 orders (41% of all orders), followed by Chicken Karahi at 24. By area, Gulshan-e-Maymar placed 52 orders, Gulshan-e-Iqbal 41, Gulistan-e-Johar 31 and North Nazimabad 24. Hamza Qureshi&apos;s Friday office orders alone are 8% of order value.</p><p className="mt-2 text-[11px] text-muted-foreground">Based on 148 orders between 1 and 31 Oct. Top questions: {topQuestions.slice(0, 2).map((q) => q.q).join("; ")}.</p></div>
        </CardContent>
      </Card>
    </>
  );
}
