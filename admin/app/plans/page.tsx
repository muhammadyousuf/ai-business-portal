import { Check, Pencil, Plus, Tag } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Pill, StatusBadge } from "@assistflow/shared/components/pill";
import { businessStatus } from "@assistflow/shared/lib/status";
import { businesses, plans } from "@assistflow/shared/mock/platform";
import { formatDate, fmtNum, fmtUsd } from "@assistflow/shared/lib/utils";

const coupons = [
  { code: "LAUNCH30", discount: "30% off for 3 months", used: 4, limit: 20, expires: "2026-12-31" },
  { code: "PKFOUNDER", discount: "PKR pricing, 2 months free", used: 2, limit: 10, expires: "2026-11-30" },
];

export default function PlansPage() {
  return (
    <>
      <PageHeader title="Subscriptions & plans" description="Plan prices apply to new cycles only. Changing a plan never rewrites past invoices." actions={<Button size="sm"><Plus /> New plan</Button>} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const subs = businesses.filter((b) => b.plan === p.key && b.status === "active").length;
          return (
            <Card key={p.key} className={p.highlight ? "border-brand/50 ring-1 ring-brand/30" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between"><CardTitle className="text-base">{p.name}</CardTitle>{p.highlight ? <Pill tone="brand">Most popular</Pill> : null}</div>
                <p className="text-2xl font-semibold tabular">{fmtUsd(p.monthlyUsd)}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
                <CardDescription>{fmtNum(p.aiReplies)} AI replies · {p.channels} channel{p.channels > 1 ? "s" : ""} · {p.staffSeats} seat{p.staffSeats > 1 ? "s" : ""}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5">{p.features.map((f) => <li key={f} className="flex items-start gap-2 text-xs"><Check className="mt-0.5 size-3 shrink-0 text-success" />{f}</li>)}</ul>
                <div className="flex items-center justify-between border-t pt-3 text-xs"><span className="text-muted-foreground">{subs} active subscription{subs === 1 ? "" : "s"}</span><Button variant="ghost" size="sm"><Pencil /> Edit</Button></div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Subscriptions</CardTitle><CardDescription>Upgrade, downgrade, pause or extend. Price changes take effect at renewal.</CardDescription></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Business</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Renews</TableHead><TableHead className="pr-5 text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {businesses.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="pl-5 font-medium">{b.name}</TableCell>
                    <TableCell><Pill tone="brand">{plans.find((p) => p.key === b.plan)!.name}</Pill></TableCell>
                    <TableCell><StatusBadge status={b.status} map={businessStatus} /></TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{formatDate(b.renewsAt)}</TableCell>
                    <TableCell className="pr-5 text-right"><Button variant="ghost" size="sm">Change</Button><Button variant="ghost" size="sm">Extend</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Tag className="size-4 text-muted-foreground" /> Coupons</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {coupons.map((c) => (
              <div key={c.code} className="rounded-lg border p-3">
                <div className="flex items-center justify-between"><code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold">{c.code}</code><span className="text-[11px] text-muted-foreground">expires {c.expires}</span></div>
                <p className="mt-1.5 text-sm">{c.discount}</p>
                <p className="text-[11px] text-muted-foreground">{c.used} of {c.limit} redemptions</p>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full"><Plus /> New coupon</Button>
            <p className="text-[11px] text-muted-foreground">Rule from the plan: never give unlimited AI replies or messages. Discounts reduce price, not limits.</p>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
