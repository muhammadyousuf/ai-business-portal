import { Download, Filter } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Input } from "@assistflow/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { auditLog } from "@assistflow/shared/mock/platform";
import { formatDate } from "@assistflow/shared/lib/utils";

export default function AuditPage() {
  return (
    <>
      <PageHeader title="Audit logs" description="Every financial, subscription, account and impersonation action. Append-only." actions={<Button variant="outline" size="sm"><Download /> Export</Button>} />
      <div className="flex flex-wrap items-center gap-2"><Input placeholder="Search actor or target…" className="h-8 w-64" /><Button variant="outline" size="sm"><Filter /> Actor</Button><Button variant="outline" size="sm"><Filter /> Action</Button><Button variant="outline" size="sm"><Filter /> Date</Button></div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>When</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead className="hidden md:table-cell text-right">IP</TableHead></TableRow></TableHeader>
          <TableBody>
            {auditLog.map((a) => (
              <TableRow key={a.id}><TableCell className="whitespace-nowrap text-xs tabular text-muted-foreground">{formatDate(a.at, { hour: "2-digit", minute: "2-digit" })}</TableCell><TableCell className="font-medium">{a.actor}</TableCell><TableCell>{a.action}</TableCell><TableCell className="text-muted-foreground">{a.target}</TableCell><TableCell className="hidden text-right font-mono text-xs text-muted-foreground md:table-cell">{a.ip ?? "—"}</TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
