"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@assistflow/shared/layout/app-shell";
import type { NavItem } from "@assistflow/shared/layout/sidebar-nav";
import { Pill } from "@assistflow/shared/components/pill";
import { useApi } from "@assistflow/shared/api/hooks";
import { OrgProvider, useOrg } from "@/lib/org-context";
import { useUser } from "@/lib/user-context";

function Shell({ children }: { children: React.ReactNode }) {
  const { me, signOut } = useUser(); const { org, base, has, label } = useOrg(); const pathname = usePathname();
  const notif = useApi<{ items: { id: string; title: string; body: string; createdAt: string; readAt?: string }[]; unread: number }>("/v1/me/notifications?limit=8", [pathname]);
  const dash = useApi<{ counts: Record<string, number> }>(`/v1/orgs/${org.uuid}/dashboard`, [pathname]);
  const c = dash.data?.counts ?? {};
  const customers: NavItem[] = [{ label: "Inbox", href: `${base}/inbox`, icon: "conversations", badge: c.needsHuman || undefined }];
  if (has("orders")) customers.push({ label: "Orders", href: `${base}/orders`, icon: "orders", badge: c.openOrders || undefined });
  if (has("appointments")) customers.push({ label: `${label("appointment", "Appointment")}s`, href: `${base}/appointments`, icon: "reports", badge: c.appointmentsRequested || undefined });
  if (has("inquiries")) customers.push({ label: "Inquiries", href: `${base}/inquiries`, icon: "documents", badge: c.inquiriesNew || undefined });
  const business: NavItem[] = [];
  if (has("branches")) business.push({ label: "Branches", href: `${base}/branches`, icon: "store" });
  if (has("catalog")) business.push({ label: `${label("catalogGroup", "Catalog")}s`, href: `${base}/catalog`, icon: "catalog" });
  if (has("staff")) business.push({ label: label("staff", "Staff"), href: `${base}/staff`, icon: "users" });
  const navGroups = [
    { items: [{ label: "Dashboard", href: base, icon: "dashboard" as const, exact: true }] },
    { label: "Customers", items: customers },
    ...(business.length ? [{ label: "Business", items: business }] : []),
    { label: "Chatbot", items: [{ label: "Chatbot & Q&A", href: `${base}/chatbot`, icon: "assistant" as const }] },
    { label: "Organization", items: [{ label: "Members", href: `${base}/members`, icon: "staff" as const }, { label: "Settings", href: `${base}/settings`, icon: "settings" as const }, { label: "Notifications", href: `${base}/notifications`, icon: "notifications" as const, badge: notif.data?.unread || undefined }] },
  ];
  return (
    <AppShell brand={{ name: org.name, subtitle: org.category?.name ?? org.categoryKey, logoText: org.name.slice(0, 1).toUpperCase(), color: "oklch(0.51 0.19 264)" }} user={{ name: me.name || me.email, email: me.email }}
      notifications={(notif.data?.items ?? []).map((n) => ({ id: n.id, title: n.title, body: n.body, at: n.createdAt, read: !!n.readAt }))} unreadCount={notif.data?.unread ?? 0}
      navGroups={navGroups} homeHref={base} searchPlaceholder="Search…" notificationsHref={`${base}/notifications`} settingsHref="/account" onSignOut={() => void signOut()}
      footer={<div className="rounded-lg bg-card p-3 text-xs shadow-xs"><div className="flex items-center justify-between"><span className="font-medium">Your role</span><Pill tone={org.role === "owner" ? "brand" : "neutral"}>{org.role}</Pill></div><Link href="/organizations" className="mt-1 block text-brand hover:underline">Switch organization</Link></div>}>
      {children}
    </AppShell>
  );
}
export default function OrgLayout({ children }: { children: React.ReactNode }) { return <OrgProvider><Shell>{children}</Shell></OrgProvider>; }
