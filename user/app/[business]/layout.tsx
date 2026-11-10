import { notFound } from "next/navigation";
import { AppShell } from "@assistflow/shared/layout/app-shell";
import type { NavItem } from "@assistflow/shared/layout/sidebar-nav";
import { UsageMeter } from "@assistflow/shared/components/mini-bars";
import { businessBySlug, planByKey } from "@assistflow/shared/mock/platform";
import { conversations, orders } from "@assistflow/shared/mock/business";

const notifications = [
  { id: "n1", title: "New order request #1048", body: "Ali Raza · 2 × Chicken Biryani + Raita · Rs. 860 · Gulshan-e-Maymar. Call to confirm.", at: "2026-10-31T13:02:00Z", read: false },
  { id: "n2", title: "New order request #1047 (WhatsApp)", body: "Sana Ahmed · Chicken Karahi half + 4 naan · Rs. 1,760.", at: "2026-10-31T12:40:00Z", read: false },
  { id: "n3", title: "Customer needs a human", body: "Usman Tariq asked for a DHA delivery exception for a 20-person order.", at: "2026-10-30T14:10:00Z", read: false },
  { id: "n4", title: "Email notification failed", body: "Order #1045 email to orders@kbh.example failed 3 times. Check SMTP settings.", at: "2026-10-30T19:50:00Z", read: true },
];

export default async function BusinessLayout({ children, params }: { children: React.ReactNode; params: Promise<{ business: string }> }) {
  const { business: slug } = await params;
  const b = businessBySlug(slug);
  if (!b) notFound();
  const base = `/${slug}`;
  const plan = planByKey(b.plan);
  const pending = orders.filter((o) => o.status === "pending").length;
  const attention = conversations.filter((c) => c.status === "needs_attention" || c.unread > 0).length;

  const navGroups: { label?: string; items: NavItem[] }[] = [
    { items: [{ label: "Dashboard", href: base, icon: "dashboard", exact: true }] },
    { label: "Customers", items: [
      { label: "Orders", href: `${base}/orders`, icon: "orders", badge: pending || undefined },
      { label: "Inbox", href: `${base}/inbox`, icon: "conversations", badge: attention || undefined },
      { label: "Customers", href: `${base}/customers`, icon: "users" },
    ] },
    { label: "AI assistant", items: [
      { label: "Menu & products", href: `${base}/catalog`, icon: "catalog" },
      { label: "Knowledge base", href: `${base}/knowledge`, icon: "knowledge" },
      { label: "Assistant settings", href: `${base}/assistant`, icon: "assistant" },
      { label: "Channels", href: `${base}/channels`, icon: "channels" },
    ] },
    { label: "Business", items: [
      { label: "Staff", href: `${base}/staff`, icon: "staff" },
      { label: "Reports", href: `${base}/reports`, icon: "reports" },
      { label: "Billing", href: `${base}/billing`, icon: "billing" },
      { label: "Settings", href: `${base}/settings`, icon: "settings" },
    ] },
  ];

  return (
    <AppShell
      brand={{ name: b.name, subtitle: `${plan.name} plan`, logoText: b.branding.logoText, color: b.branding.brand }}
      user={{ name: b.owner.name, email: b.owner.email }}
      notifications={notifications}
      navGroups={navGroups}
      homeHref={base}
      searchPlaceholder="Search orders, customers, conversations…"
      footer={<div className="rounded-lg bg-card p-3 shadow-xs"><UsageMeter used={b.usage.aiReplies} limit={plan.aiReplies} label="AI replies this cycle" /><p className="mt-2 text-[11px] text-muted-foreground">Renews 14 Nov · <a href={`${base}/billing`} className="text-brand hover:underline">Upgrade</a></p></div>}
    >
      {children}
    </AppShell>
  );
}
