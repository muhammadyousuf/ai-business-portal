import { Download } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { MiniBars } from "@assistflow/shared/components/mini-bars";
import { businesses, industryLabel, mrrHistory } from "@assistflow/shared/mock/platform";
import { fmtUsd } from "@assistflow/shared/lib/utils";

export default function ReportsPage() {
  const byCountry = Object.entries(businesses.reduce<Record<string, number>>((a, b) => { a[b.country] = (a[b.country] ?? 0) + b.mrrUsd; return a; }, {})).map(([label, value]) => ({ label, value }));
  const byIndustry = Object.entries(businesses.reduce<Record<string, number>>((a, b) => { a[industryLabel[b.industry]] = (a[industryLabel[b.industry]] ?? 0) + 1; return a; }, {})).map(([label, value]) => ({ label, value }));
  const kpis = [
    ["AI resolution rate", "84%", "Inquiries resolved without staff"], ["Human handover rate", "11%", "Target under 15%"], ["Order conversion", "38%", "Conversations that produced a request"],
    ["Unanswered rate", "4.2%", "No reliable answer found"], ["Monthly active businesses", "6 of 8", "Opened portal or had traffic"], ["Churn (Oct)", "1 business", "Maple Realty, low usage"], ["Gross margin", "≈ 71%", "After AI cost, before messaging fees"], ["Avg response time", "3.8s", "Customer waits, p50"],
  ];
  return (
    <>
      <PageHeader title="Reports & analytics" description="The KPIs from the business plan. Exports are CSV or PDF per report." actions={<Button variant="outline" size="sm"><Download /> Export all</Button>} />
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map(([k, v, d]) => <Card key={k} className="p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-xl font-semibold tabular">{v}</p><p className="text-[11px] text-muted-foreground">{d}</p></Card>)}
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <Card><CardHeader><CardTitle>MRR by month</CardTitle></CardHeader><CardContent><MiniBars data={mrrHistory.map((m) => ({ label: m.month, value: m.mrr }))} format={fmtUsd} highlightLast /></CardContent></Card>
        <Card><CardHeader><CardTitle>MRR by country</CardTitle><CardDescription>International pays in USD/GBP; Pakistan on PKR plans.</CardDescription></CardHeader><CardContent><MiniBars data={byCountry} format={fmtUsd} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Businesses by industry</CardTitle></CardHeader><CardContent><MiniBars data={byIndustry} /></CardContent></Card>
      </section>
    </>
  );
}
