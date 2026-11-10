import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@assistflow/shared/ui/table";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Pill, StatusBadge } from "@assistflow/shared/components/pill";
import { ticketStatus } from "@assistflow/shared/lib/status";
import { businessById, tickets } from "@assistflow/shared/mock/platform";
import { relativeTime } from "@assistflow/shared/lib/utils";

const announcements = [
  { title: "WhatsApp template approval delays", body: "Meta is taking 2–3 days to approve new templates. Tell new businesses during onboarding.", at: "2026-10-29" },
  { title: "Instagram channel now on Pro", body: "Shipped 20 Oct. Lotus Dental and Spice Route connected.", at: "2026-10-20" },
];

export default function SupportPage() {
  return (
    <>
      <PageHeader title="Support & tickets" description="Business complaints, feature requests and onboarding help." actions={<Button size="sm"><Plus /> New ticket</Button>} />
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Tickets</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="pl-5">Subject</TableHead><TableHead>Business</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead className="pr-5 text-right">Opened</TableHead></TableRow></TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}><TableCell className="pl-5 font-medium">{t.subject}</TableCell><TableCell className="text-muted-foreground">{businessById(t.businessId)?.name}</TableCell><TableCell><Pill tone={t.priority === "high" ? "destructive" : t.priority === "normal" ? "info" : "neutral"}>{t.priority}</Pill></TableCell><TableCell><StatusBadge status={t.status} map={ticketStatus} /></TableCell><TableCell className="pr-5 text-right text-xs text-muted-foreground">{relativeTime(t.openedAt)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="size-4 text-muted-foreground" /> Announcements</CardTitle><CardDescription>Shown in every business portal.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {announcements.map((a) => <div key={a.title} className="rounded-lg border p-3"><p className="text-sm font-medium">{a.title}</p><p className="mt-1 text-xs text-muted-foreground">{a.body}</p><p className="mt-1.5 text-[11px] text-muted-foreground">{a.at}</p></div>)}
            <Button variant="outline" size="sm" className="w-full"><Plus /> New announcement</Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
