"use client";
import * as React from "react";
import { Copy, Mail, Plus, RefreshCw, Trash2, UserMinus, Crown } from "lucide-react";
import { useApi } from "@assistflow/shared/api/hooks";
import { api } from "@assistflow/shared/api/client";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Button } from "@assistflow/shared/ui/button";
import { Textarea } from "@assistflow/shared/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Field } from "@assistflow/shared/components/form";
import { ConfirmDialog } from "@assistflow/shared/components/confirm";
import { Loading } from "@assistflow/shared/components/states";
import { Pill } from "@assistflow/shared/components/pill";
import { UserAvatar } from "@assistflow/shared/components/user-avatar";
import { useToast } from "@assistflow/shared/ui/toast";
import { useOrg } from "@/lib/org-context";
import { useUser } from "@/lib/user-context";
import { FormDialog } from "@/components/crud";
import { fmtDate } from "@/components/common";

interface Member { id: string; name: string; email: string; role: string; joinedAt: string; avatarUrl: string }
interface Invite { id: string; email: string; role: string; expiresAt: string; emailSent: boolean; invitedBy: string }

export default function MembersPage() {
  const { org, isOwner, refresh } = useOrg(); const { me } = useUser(); const toast = useToast();
  const members = useApi<{ items: Member[] }>(`/v1/orgs/${org.uuid}/members`); const invites = useApi<{ items: Invite[] }>(`/v1/orgs/${org.uuid}/invitations`);
  const [open, setOpen] = React.useState(false); const [emails, setEmails] = React.useState(""); const [results, setResults] = React.useState<{ email: string; status: string; link?: string; delivery?: string }[]>([]);
  const [confirm, setConfirm] = React.useState<{ kind: "remove" | "transfer" | "revoke" | "leave"; id: string; name: string } | null>(null);
  async function invite() { const list = emails.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean); const r = await api.post<{ results: typeof results }>(`/v1/orgs/${org.uuid}/invitations`, { emails: list }); setResults(r.results); setEmails(""); await invites.refetch(); toast.success("Invitations sent"); }
  const copy = (link: string) => { navigator.clipboard.writeText(link); toast.success("Link copied"); };
  async function act() {
    if (!confirm) return;
    if (confirm.kind === "remove") await api.delete(`/v1/orgs/${org.uuid}/members/${confirm.id}`);
    if (confirm.kind === "transfer") { await api.post(`/v1/orgs/${org.uuid}/transfer-ownership`, { userId: confirm.id }); await refresh(); }
    if (confirm.kind === "revoke") await api.delete(`/v1/orgs/${org.uuid}/invitations/${confirm.id}`);
    if (confirm.kind === "leave") { await api.post(`/v1/orgs/${org.uuid}/leave`); window.location.href = "/organizations"; return; }
    toast.success("Done"); await Promise.all([members.refetch(), invites.refetch()]);
  }
  return (
    <>
      <PageHeader title="Members" description="Owners and members manage the organization together. Only the owner can remove members or delete the organization." actions={<Button size="sm" onClick={() => { setResults([]); setOpen(true); }}><Plus /> Invite people</Button>} />
      <Card><CardHeader><CardTitle>Team</CardTitle></CardHeader><CardContent className="divide-y">
        {members.loading && !members.data ? <Loading /> : members.data?.items.map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-2.5">{m.avatarUrl ? <img src={m.avatarUrl} alt="" className="size-8 rounded-full object-cover" /> : <UserAvatar name={m.name || m.email} />}<div className="min-w-0 flex-1"><p className="text-sm font-medium">{m.name || m.email}{m.id === me.id ? <span className="ml-1 text-xs text-muted-foreground">(you)</span> : null}</p><p className="truncate text-xs text-muted-foreground">{m.email} · joined {fmtDate(m.joinedAt)}</p></div><Pill tone={m.role === "owner" ? "brand" : "neutral"}>{m.role}</Pill>
            {isOwner && m.id !== me.id ? <><Button variant="ghost" size="sm" onClick={() => setConfirm({ kind: "transfer", id: m.id, name: m.name || m.email })}><Crown /> Make owner</Button><Button variant="ghost" size="icon-sm" onClick={() => setConfirm({ kind: "remove", id: m.id, name: m.name || m.email })} aria-label="Remove"><UserMinus /></Button></> : null}
            {!isOwner && m.id === me.id ? <Button variant="ghost" size="sm" onClick={() => setConfirm({ kind: "leave", id: m.id, name: org.name })}>Leave</Button> : null}
          </div>))}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Pending invitations</CardTitle><CardDescription>Links expire after 7 days. Share the link directly if the email did not arrive.</CardDescription></CardHeader><CardContent className="divide-y">
        {!invites.data?.items.length ? <p className="py-4 text-xs text-muted-foreground">No pending invitations.</p> : invites.data.items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 py-2.5 text-sm"><Mail className="size-4 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="font-medium">{i.email}</p><p className="text-xs text-muted-foreground">invited by {i.invitedBy} · expires {fmtDate(i.expiresAt)} · {i.emailSent ? "email sent" : "share the link"}</p></div>
            <Button variant="ghost" size="sm" onClick={async () => { const r = await api.post<{ link: string }>(`/v1/orgs/${org.uuid}/invitations/${i.id}/resend`); copy(r.link); await invites.refetch(); }}><RefreshCw /> New link</Button><Button variant="ghost" size="icon-sm" onClick={() => setConfirm({ kind: "revoke", id: i.id, name: i.email })} aria-label="Revoke"><Trash2 /></Button></div>))}
      </CardContent></Card>
      <FormDialog open={open} onOpenChange={setOpen} title="Invite people" description="Enter one or more email addresses. Each person gets a link; new users create an account and join automatically." submitLabel="Send invitations" onSubmit={invite}>{(errors) => (<>
        <Field label="Email addresses" hint="separate with commas or new lines" error={errors.emails}><Textarea value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="ali@example.com, sara@example.com" required /></Field>
        {results.length ? <div className="space-y-2 rounded-md border p-3 text-sm">{results.map((r) => <div key={r.email} className="flex items-center justify-between gap-2"><span>{r.email} <span className="text-xs text-muted-foreground">{r.status === "invited" ? `· ${r.delivery}` : "· already a member"}</span></span>{r.link ? <Button type="button" size="sm" variant="outline" onClick={() => copy(r.link!)}><Copy /> Copy link</Button> : null}</div>)}</div> : null}
      </>)}</FormDialog>
      <ConfirmDialog open={!!confirm} onOpenChange={() => setConfirm(null)} destructive={confirm?.kind !== "transfer"} confirmLabel={confirm?.kind === "transfer" ? "Transfer ownership" : confirm?.kind === "leave" ? "Leave" : confirm?.kind === "revoke" ? "Revoke" : "Remove"} title={confirm?.kind === "transfer" ? `Make ${confirm.name} the owner?` : confirm?.kind === "leave" ? `Leave ${confirm?.name}?` : confirm?.kind === "revoke" ? `Revoke invitation for ${confirm?.name}?` : `Remove ${confirm?.name}?`} description={confirm?.kind === "transfer" ? "You will become a member. Only the new owner can delete the organization or remove members." : undefined} onConfirm={act} />
    </>
  );
}
