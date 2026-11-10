import Link from "next/link";
import { Download, Plus, Send } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { StatusBadge, Pill } from "@assistflow/shared/components/pill";
import { invoiceStatus } from "@assistflow/shared/lib/status";
import { businessById, invoices, planByKey } from "@assistflow/shared/mock/platform";
import { formatDate, fmtUsd } from "@assistflow/shared/lib/utils";

export default function InvoicesPage() {
  return (
    <>
      <PageHeader title="Invoices & billing" description="Generated automatically at the start of each cycle. Numbers are sequential and never reused." actions={<><Button variant="outline" size="sm"><Download /> Export</Button><Button size="sm"><Plus /> Manual invoice</Button></>} />
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Number</TableHead><TableHead>Business</TableHead><TableHead className="hidden md:table-cell">Plan</TableHead><TableHead className="hidden lg:table-cell">Period</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="hidden md:table-cell text-right">Due</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {invoices.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium"><Link href={`/invoices/${i.id}`} className="hover:underline">{i.number}</Link></TableCell>
                <TableCell>{businessById(i.businessId)?.name}</TableCell>
                <TableCell className="hidden md:table-cell"><Pill tone="brand">{planByKey(i.plan).name}</Pill></TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{i.period}</TableCell>
                <TableCell><StatusBadge status={i.status} map={invoiceStatus} /></TableCell>
                <TableCell className="text-right tabular font-medium">{fmtUsd(i.amountUsd + i.taxUsd)}</TableCell>
                <TableCell className="hidden text-right text-xs text-muted-foreground md:table-cell">{formatDate(i.dueAt)}</TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon-sm" aria-label="Download PDF"><Download /></Button><Button variant="ghost" size="icon-sm" aria-label="Email invoice"><Send /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
