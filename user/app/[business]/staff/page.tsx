import { Plus } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Pill } from "@assistflow/shared/components/pill";
import { UserAvatar } from "@assistflow/shared/components/user-avatar";
import { staff } from "@assistflow/shared/mock/business";

const perms = [["View orders", true, true, true], ["Confirm / reject orders", true, true, true], ["Reply in inbox", true, true, true], ["Edit menu and prices", true, true, false], ["Edit assistant settings", true, false, false], ["View reports", true, true, false], ["Billing", true, false, false]];

export default function StaffPage() {
  return (
    <>
      <PageHeader title="Staff" description="3 of 3 seats used on Growth. Each person sees only what their role allows." actions={<Button size="sm"><Plus /> Invite</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Team</CardTitle></CardHeader><CardContent className="divide-y">
          {staff.map((s) => <div key={s.id} className="flex items-center gap-3 py-2.5"><UserAvatar name={s.name} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{s.name} <span className={`ml-1 inline-block size-1.5 rounded-full ${s.online ? "bg-success" : "bg-muted-foreground/40"}`} /></p><p className="truncate text-xs text-muted-foreground">{s.email} · {s.handled30d} conversations handled (30d)</p></div><Pill tone={s.role === "owner" ? "brand" : "neutral"}>{s.role}</Pill></div>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Permissions</CardTitle><CardDescription>Owner · Manager · Agent</CardDescription></CardHeader><CardContent>
          <table className="w-full text-sm"><tbody>{perms.map(([p, o, m, a]) => <tr key={p as string} className="border-b last:border-0"><td className="py-2">{p as string}</td>{[o, m, a].map((v, i) => <td key={i} className="py-2 text-center">{v ? <span className="text-success">✓</span> : <span className="text-muted-foreground">—</span>}</td>)}</tr>)}</tbody></table>
        </CardContent></Card>
      </div>
    </>
  );
}
