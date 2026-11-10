import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Input } from "@assistflow/shared/ui/input";
import { Label } from "@assistflow/shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@assistflow/shared/ui/tabs";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Pill } from "@assistflow/shared/components/pill";
import { UserAvatar } from "@assistflow/shared/components/user-avatar";
import { PRODUCT_DOMAIN, PRODUCT_NAME, platformUsers } from "@assistflow/shared/mock/platform";

const roles = [
  { role: "super_admin", can: ["Everything", "Unmask customer data in audited sessions", "Change plans and prices", "Void invoices"] },
  { role: "finance", can: ["Invoices, payments, refunds", "Revenue reports", "No conversation access"] },
  { role: "support", can: ["Tickets", "Read conversations (masked)", "Extend trials up to 7 days", "No billing changes"] },
];

export default function PlatformSettings() {
  return (
    <>
      <PageHeader title="Settings & roles" description="Platform identity, staff access, AI provider keys and notification defaults." />
      <Tabs defaultValue="general">
        <TabsList><TabsTrigger value="general">General</TabsTrigger><TabsTrigger value="staff">Staff & roles</TabsTrigger><TabsTrigger value="ai">AI providers</TabsTrigger><TabsTrigger value="channels">Channel apps</TabsTrigger></TabsList>
        <TabsContent value="general">
          <Card><CardHeader><CardTitle>Platform identity</CardTitle><CardDescription>Appears on invoices, emails and the marketing site.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Product name</Label><Input defaultValue={PRODUCT_NAME} /><p className="text-[11px] text-muted-foreground">Placeholder. Decide the real brand before launch.</p></div>
              <div className="space-y-1.5"><Label>Primary domain</Label><Input defaultValue={PRODUCT_DOMAIN} /></div>
              <div className="space-y-1.5"><Label>Business portal</Label><Input defaultValue={`app.${PRODUCT_DOMAIN}`} /></div>
              <div className="space-y-1.5"><Label>Admin portal</Label><Input defaultValue={`admin.${PRODUCT_DOMAIN}`} /></div>
              <div className="space-y-1.5"><Label>Billing email</Label><Input defaultValue="billing@assistflow.example" /></div>
              <div className="space-y-1.5"><Label>Default grace period (days)</Label><Input defaultValue="14" /></div>
              <div className="sm:col-span-2 flex justify-end"><Button>Save</Button></div>
            </CardContent></Card>
        </TabsContent>
        <TabsContent value="staff" className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle>Platform staff</CardTitle><Button size="sm">Invite</Button></CardHeader>
            <CardContent><ul className="divide-y">{platformUsers.map((u) => <li key={u.id} className="flex items-center gap-3 py-2.5"><UserAvatar name={u.name} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{u.name}</p><p className="truncate text-xs text-muted-foreground">{u.email}</p></div><Pill tone={u.role === "super_admin" ? "brand" : "neutral"}>{u.role}</Pill></li>)}</ul></CardContent></Card>
          <Card><CardHeader><CardTitle>Roles</CardTitle><CardDescription>Least privilege. Impersonation is always logged.</CardDescription></CardHeader>
            <CardContent className="space-y-3">{roles.map((r) => <div key={r.role} className="rounded-lg border p-3"><Pill tone={r.role === "super_admin" ? "brand" : "neutral"}>{r.role}</Pill><ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">{r.can.map((c) => <li key={c}>· {c}</li>)}</ul></div>)}</CardContent></Card>
        </TabsContent>
        <TabsContent value="ai">
          <Card><CardHeader><CardTitle>AI providers</CardTitle><CardDescription>Platform keys for all businesses. Costs are metered per business and shown on AI Usage.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Primary provider</Label><Input defaultValue="Anthropic" /></div><div className="space-y-1.5"><Label>API key</Label><Input type="password" defaultValue="sk-ant-••••••••••••" /></div>
              <div className="space-y-1.5"><Label>Model: FAQ, prices, order collection</Label><Input defaultValue="claude-haiku-5-5" /></div><div className="space-y-1.5"><Label>Model: complaints, analyst questions</Label><Input defaultValue="claude-sonnet-5-5" /></div>
              <div className="space-y-1.5"><Label>Embeddings</Label><Input defaultValue="provider embeddings, 1536 dims" /></div><div className="space-y-1.5"><Label>Monthly cost alert (USD)</Label><Input defaultValue="150" /></div>
              <div className="sm:col-span-2 flex justify-end"><Button>Save</Button></div>
            </CardContent></Card>
        </TabsContent>
        <TabsContent value="channels">
          <Card><CardHeader><CardTitle>Channel apps</CardTitle><CardDescription>One Meta app and one WhatsApp Business account for the platform; each business connects its own number or page.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Meta App ID</Label><Input defaultValue="1029384756" /></div><div className="space-y-1.5"><Label>Webhook verify token</Label><Input type="password" defaultValue="••••••••" /></div>
              <div className="space-y-1.5"><Label>WhatsApp Cloud API token</Label><Input type="password" defaultValue="EAAG••••••••" /></div><div className="space-y-1.5"><Label>Email provider</Label><Input defaultValue="Resend · notifications@assistflow.app" /></div>
              <div className="sm:col-span-2 flex justify-end"><Button>Save</Button></div>
            </CardContent></Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
