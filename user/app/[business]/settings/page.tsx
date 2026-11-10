import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Input } from "@assistflow/shared/ui/input";
import { Label } from "@assistflow/shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@assistflow/shared/ui/tabs";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { BrandMark } from "@assistflow/shared/components/brand-mark";
import { businessBySlug, industryLabel } from "@assistflow/shared/mock/platform";

export default async function BusinessSettings({ params }: { params: Promise<{ business: string }> }) {
  const { business: slug } = await params;
  const b = businessBySlug(slug)!;
  return (
    <>
      <PageHeader title="Settings" description="Business profile, notifications and widget appearance." />
      <Tabs defaultValue="profile">
        <TabsList><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="notifications">Notifications</TabsTrigger><TabsTrigger value="widget">Widget</TabsTrigger><TabsTrigger value="data">Data & privacy</TabsTrigger></TabsList>
        <TabsContent value="profile"><Card><CardHeader><CardTitle>Business profile</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Business name</Label><Input defaultValue={b.name} /></div><div className="space-y-1.5"><Label>Industry template</Label><Input defaultValue={industryLabel[b.industry]} /></div>
          <div className="space-y-1.5"><Label>Owner</Label><Input defaultValue={b.owner.name} /></div><div className="space-y-1.5"><Label>Phone (also WhatsApp alerts)</Label><Input defaultValue={b.owner.phone} /></div>
          <div className="space-y-1.5"><Label>Orders email</Label><Input defaultValue="orders@kbh.example" /></div><div className="space-y-1.5"><Label>Currency</Label><Input defaultValue={b.currency} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Input defaultValue="Plot 14, Sector Z, Gulshan-e-Maymar, Karachi" /></div>
          <div className="sm:col-span-2 flex justify-end"><Button>Save</Button></div>
        </CardContent></Card></TabsContent>
        <TabsContent value="notifications"><Card><CardHeader><CardTitle>When to notify you</CardTitle><CardDescription>WhatsApp to the owner number and email to the orders address.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          {["New order request", "Customer needs a human", "Order unconfirmed for 10 minutes", "Daily summary at 23:45", "Negative feedback or complaint", "Notification delivery failed"].map((r, i) => <label key={r} className="flex items-center gap-2 rounded-md border px-3 py-2"><input type="checkbox" defaultChecked={i !== 3} className="accent-[var(--brand)]" />{r}</label>)}
        </CardContent></Card></TabsContent>
        <TabsContent value="widget"><Card><CardHeader><CardTitle>Widget appearance</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Accent colour</Label><div className="flex items-center gap-3"><BrandMark text={b.branding.logoText} /><Input defaultValue={b.branding.brand} className="font-mono text-xs" /></div></div>
          <div className="space-y-1.5"><Label>Button label</Label><Input defaultValue="Chat with us" /></div>
          <div className="space-y-1.5"><Label>Position</Label><Input defaultValue="Bottom right" /></div><div className="space-y-1.5"><Label>Show on pages</Label><Input defaultValue="All pages" /></div>
          <div className="sm:col-span-2 flex justify-end"><Button>Save</Button></div>
        </CardContent></Card></TabsContent>
        <TabsContent value="data"><Card><CardHeader><CardTitle>Data & privacy</CardTitle><CardDescription>Your customers&apos; data belongs to you.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-md border p-3"><div><p className="font-medium">Export all data</p><p className="text-xs text-muted-foreground">Orders, customers and conversations as CSV.</p></div><Button variant="outline" size="sm">Export</Button></div>
          <div className="flex items-center justify-between rounded-md border p-3"><div><p className="font-medium">Conversation retention</p><p className="text-xs text-muted-foreground">Delete customer messages after this many days.</p></div><Input defaultValue="365" className="h-8 w-24" /></div>
          <div className="flex items-center justify-between rounded-md border border-destructive/30 p-3"><div><p className="font-medium">Delete business</p><p className="text-xs text-muted-foreground">Removes all data after a 30-day grace period.</p></div><Button variant="destructive" size="sm">Delete</Button></div>
        </CardContent></Card></TabsContent>
      </Tabs>
    </>
  );
}
