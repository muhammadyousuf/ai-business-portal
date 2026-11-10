import { Bot, Pause, Play, Sparkles } from "lucide-react";
import { Button } from "@assistflow/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@assistflow/shared/ui/card";
import { Input } from "@assistflow/shared/ui/input";
import { Label } from "@assistflow/shared/ui/label";
import { Textarea } from "@assistflow/shared/ui/textarea";
import { PageHeader } from "@assistflow/shared/components/page-header";
import { Pill } from "@assistflow/shared/components/pill";
import { ConversationThread } from "@/components/business/conversation-thread";
import { conversations } from "@assistflow/shared/mock/business";

const tools = [
  ["searchProducts", "Find items in the menu by name or description", true], ["getProductPrice", "Quote exact prices and options", true], ["checkDeliveryAvailability", "Confirm area, charge and ETA", true],
  ["createOrderRequest", "Collect name, phone, address and items", true], ["requestAppointment", "Book a slot (not used by restaurants)", false], ["handoverToHuman", "Escalate complaints, exceptions, low confidence", true],
];

export default function AssistantSettings() {
  const sample = conversations[0];
  return (
    <>
      <PageHeader title="Assistant settings" description="Tone, languages, what the assistant may do, and when it must hand over to a person." actions={<><Button variant="outline" size="sm"><Pause /> Pause assistant</Button><Button size="sm"><Play /> Test in sandbox</Button></>} />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card><CardHeader><CardTitle>Persona</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Assistant name</Label><Input defaultValue="Karachi Biryani House assistant" /></div>
            <div className="space-y-1.5"><Label>Languages</Label><Input defaultValue="English, Urdu (Roman)" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Tone and rules (plain language)</Label><Textarea className="min-h-[96px]" defaultValue={"Friendly and brief. Use the customer's language. Always quote prices from the menu and delivery charges from the zones list. Never promise a delivery time shorter than the zone ETA. For complaints, apologise once and hand over to staff."} /></div>
            <div className="space-y-1.5"><Label>Greeting</Label><Input defaultValue="Hi! Ask me about the menu, prices, delivery areas or timings." /></div>
            <div className="space-y-1.5"><Label>Out-of-hours message</Label><Input defaultValue="We open at 12:00. I can still answer questions or take a pre-order." /></div>
            <div className="sm:col-span-2 flex justify-end"><Button>Save</Button></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Allowed actions</CardTitle><CardDescription>The assistant can only call these functions, and only with your business data.</CardDescription></CardHeader><CardContent className="divide-y">
            {tools.map(([n, d, on]) => <div key={n as string} className="flex items-center gap-3 py-2.5"><code className="w-56 shrink-0 font-mono text-xs">{n as string}</code><span className="flex-1 text-sm text-muted-foreground">{d as string}</span><Pill tone={on ? "success" : "neutral"}>{on ? "On" : "Off"}</Pill></div>)}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Handover rules</CardTitle><CardDescription>When a person takes over. Owner is notified by WhatsApp each time.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            {["Confidence below 60%", "Customer asks for a policy exception", "Complaint or negative sentiment", "Order above Rs. 10,000", "Customer asks for a human", "Question outside the knowledge base twice"].map((r) => <label key={r} className="flex items-center gap-2 rounded-md border px-3 py-2"><input type="checkbox" defaultChecked className="accent-[var(--brand)]" />{r}</label>)}
          </CardContent></Card>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bot className="size-4 text-brand" /> Live preview</CardTitle><CardDescription>A real conversation from today, using the current settings.</CardDescription></CardHeader><CardContent><ConversationThread messages={sample.messages.slice(0, 6)} compact /></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-brand" /> Quality this month</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            {[["Resolved without staff", "87%"], ["Average confidence", "0.91"], ["Wrong answers reported", "2"], ["Avg reply time", "4s"]].map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="tabular font-medium">{v}</span></div>)}
            <p className="pt-2 text-xs text-muted-foreground">Both reported answers were about DHA delivery. Add a rule or zone to fix.</p>
          </CardContent></Card>
        </div>
      </div>
    </>
  );
}
