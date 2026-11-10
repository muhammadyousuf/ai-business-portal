import { Download } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { KpiCard } from "@assistflow/shared/dashboard/kpi-card";
import { MiniBars } from "@assistflow/shared/components/mini-bars";
import { StatusBadge } from "@assistflow/shared/components/pill";
import { paymentStatus } from "@assistflow/shared/lib/status";
import { DollarSign, RotateCcw, TrendingUp, Wallet } from "lucide-react";
import { businessById, invoices, mrrHistory, payments, platformKpis } from "@assistflow/shared/mock/platform";
import { formatDate, fmtUsd } from "@assistflow/shared/lib/utils";

export default function RevenuePage() {
  const collected = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amountUsd, 0);
  const invoiced = invoices.filter((i) => i.status !== "void").reduce((s, i) => s + i.amountUsd, 0);
  const byPlan = ["starter", "growth", "pro", "business"].map((k) => ({ label: k, value: invoices.filter((i) => i.plan === k && i.status === "paid").reduce((s, i) => s + i.amountUsd, 0) }));
  return (
    <>
      <PageHeader title="Payments & revenue" description="Invoiced, collected and outstanding are tracked separately. Business order values are never mixed in here." actions={<Button variant="outline" size="sm"><Download /> Export ledger</Button>} />
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="MRR" value={fmtUsd(platformKpis.mrr)} delta="ARR ≈ $3,780" icon={TrendingUp} tone="brand" />
        <KpiCard label="Invoiced (Oct)" value={fmtUsd(invoiced)} delta={`${invoices.filter((i) => i.status !== "void").length} invoices`} icon={DollarSign} />
        <KpiCard label="Collected (Oct)" value={fmtUsd(collected)} delta={`${payments.filter((p) => p.status === "paid").length} payments`} icon={Wallet} />
        <KpiCard label="Outstanding" value={fmtUsd(platformKpis.outstanding)} delta="1 overdue ($99), 2 due ($118)" icon={RotateCcw} tone="warning" />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>MRR trend</CardTitle><CardDescription>Gross, USD. Oct dipped after Maple Realty cancelled.</CardDescription></CardHeader><CardContent><MiniBars data={mrrHistory.map((m) => ({ label: m.month, value: m.mrr }))} format={fmtUsd} highlightLast /></CardContent></Card>
        <Card><CardHeader><CardTitle>Collected by plan (Oct)</CardTitle><CardDescription>Growth and Pro carry the business.</CardDescription></CardHeader><CardContent><MiniBars data={byPlan} format={fmtUsd} /></CardContent></Card>
      </section>
      <Card>
        <CardHeader><CardTitle>Payments</CardTitle><CardDescription>Gateway references are kept for reconciliation. Refunds and credit notes never edit a paid invoice.</CardDescription></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Business</TableHead><TableHead>Invoice</TableHead><TableHead className="hidden md:table-cell">Method</TableHead><TableHead className="hidden lg:table-cell">Reference</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="pr-5 text-right">Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-5 font-medium">{businessById(p.businessId)?.name}</TableCell>
                  <TableCell className="text-muted-foreground">{invoices.find((i) => i.id === p.invoiceId)?.number}</TableCell>
                  <TableCell className="hidden capitalize text-muted-foreground md:table-cell">{p.method.replace("_", " ")}</TableCell>
                  <TableCell className="hidden font-mono text-xs lg:table-cell">{p.reference}</TableCell>
                  <TableCell><StatusBadge status={p.status} map={paymentStatus} /></TableCell>
                  <TableCell className="text-right tabular font-medium">{fmtUsd(p.amountUsd)}</TableCell>
                  <TableCell className="pr-5 text-right text-xs text-muted-foreground">{formatDate(p.at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
