import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Download, Send } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { StatusBadge } from "@assistflow/shared/components/pill";
import { invoiceStatus } from "@assistflow/shared/lib/status";
import { PRODUCT_NAME, businessById, invoices, payments, planByKey } from "@assistflow/shared/mock/platform";
import { formatDate, fmtUsd } from "@assistflow/shared/lib/utils";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inv = invoices.find((i) => i.id === id);
  if (!inv) notFound();
  const b = businessById(inv.businessId)!;
  const plan = planByKey(inv.plan);
  const pay = payments.find((p) => p.invoiceId === inv.id);
  return (
    <>
      <nav className="flex items-center gap-1 text-xs text-muted-foreground"><Link href="/invoices" className="hover:text-foreground">Invoices</Link><ChevronRight className="size-3" /><span className="text-foreground">{inv.number}</span></nav>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><h1 className="text-xl font-semibold tracking-tight">Invoice {inv.number}</h1><StatusBadge status={inv.status} map={invoiceStatus} /></div>
        <div className="flex gap-2"><Button variant="outline" size="sm"><Send /> Email to {b.owner.name.split(" ")[0]}</Button><Button size="sm"><Download /> Download PDF</Button></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div><p className="text-lg font-semibold">{PRODUCT_NAME}</p><p className="text-xs text-muted-foreground">Karachi, Pakistan · billing@assistflow.example</p></div>
              <div className="text-right text-sm"><p className="font-mono font-semibold">{inv.number}</p><p className="text-xs text-muted-foreground">Issued {formatDate(inv.issuedAt, { year: "numeric" })}</p><p className="text-xs text-muted-foreground">Due {formatDate(inv.dueAt, { year: "numeric" })}</p></div>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 text-sm">
              <div><p className="text-xs text-muted-foreground">Bill to</p><p className="font-medium">{b.name}</p><p>{b.owner.name}</p><p className="text-muted-foreground">{b.owner.email}</p><p className="text-muted-foreground">{b.city}, {b.country}</p></div>
              <div><p className="text-xs text-muted-foreground">Billing period</p><p className="font-medium">{inv.period}</p><p className="mt-2 text-xs text-muted-foreground">Payment status</p><p className="font-medium capitalize">{inv.status}{pay ? ` · ${pay.method.replace("_", " ")} · ${pay.reference}` : ""}</p></div>
            </div>
            <table className="mt-8 w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="pb-2 font-medium">Description</th><th className="pb-2 text-right font-medium">Qty</th><th className="pb-2 text-right font-medium">Amount</th></tr></thead>
              <tbody>
                <tr className="border-b"><td className="py-3"><p className="font-medium">{plan.name} plan, monthly subscription</p><p className="text-xs text-muted-foreground">{plan.aiReplies.toLocaleString()} AI replies · {plan.channels} channels · {plan.staffSeats} staff seats</p></td><td className="py-3 text-right tabular">1</td><td className="py-3 text-right tabular">{fmtUsd(inv.amountUsd)}</td></tr>
              </tbody>
              <tfoot>
                <tr><td /><td className="pt-3 text-right text-muted-foreground">Subtotal</td><td className="pt-3 text-right tabular">{fmtUsd(inv.amountUsd)}</td></tr>
                <tr><td /><td className="pt-1 text-right text-muted-foreground">Tax</td><td className="pt-1 text-right tabular">{fmtUsd(inv.taxUsd)}</td></tr>
                <tr><td /><td className="pt-2 text-right font-semibold">Total</td><td className="pt-2 text-right text-lg font-semibold tabular">{fmtUsd(inv.amountUsd + inv.taxUsd)}</td></tr>
              </tfoot>
            </table>
            <p className="mt-8 text-[11px] text-muted-foreground">Pay by card at the link in your email, or by bank transfer quoting {inv.number}. AI usage beyond plan limits is billed on the next invoice at the published overage rate.</p>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>Actions</CardTitle></CardHeader><CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">Record manual payment</Button>
            <Button variant="outline" className="w-full justify-start">Issue credit note</Button>
            <Button variant="outline" className="w-full justify-start">Send reminder</Button>
            <Button variant="ghost" className="w-full justify-start text-destructive">Void invoice</Button>
            <p className="pt-1 text-[11px] text-muted-foreground">Issued invoices are immutable. Corrections go through credit notes so the financial record stays intact.</p>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>History</CardTitle></CardHeader><CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>{formatDate(inv.issuedAt)} · Generated by renewal job</p><p>{formatDate(inv.issuedAt)} · Emailed to {b.owner.email}</p>{pay ? <p>{formatDate(pay.at)} · Payment {pay.status} ({pay.method.replace("_", " ")})</p> : null}{inv.status === "overdue" ? <p className="text-destructive">{formatDate(inv.dueAt)} · Passed due date, reminders sent day 1, 7, 14</p> : null}
          </CardContent></Card>
        </div>
      </div>
    </>
  );
}
