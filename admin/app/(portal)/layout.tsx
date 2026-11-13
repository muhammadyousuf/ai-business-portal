"use client";
import { usePathname } from "next/navigation";
import { AppShell } from "@assistflow/shared/layout/app-shell";
import type { NavItem } from "@assistflow/shared/layout/sidebar-nav";
import { Badge } from "@assistflow/shared/ui/badge";
import { useApi } from "@assistflow/shared/api/hooks";
import { AdminProvider, useAdmin } from "@/lib/admin-context";

function Shell({ children }: { children: React.ReactNode }) {
  const { admin, signOut } = useAdmin();
  const pathname = usePathname();
  const notif = useApi<{ items: { id: string; title: string; body: string; createdAt: string; readAt?: string }[]; unread: number }>("/v1/me/notifications?limit=8&__admin=1", [pathname]);
  const adminNotif = useApi<{ items: { id: string; title: string; body: string; createdAt: string; readAt?: string }[]; unread: number }>("/v1/admin/notifications?limit=8", [pathname]);
  void notif;
  const navGroups: { label?: string; items: NavItem[] }[] = [
    { items: [{ label: "Dashboard", href: "/", icon: "dashboard", exact: true }] },
    { label: "Platform", items: [{ label: "Organizations", href: "/organizations", icon: "businesses" }, { label: "Categories", href: "/categories", icon: "catalog" }, { label: "Users", href: "/users", icon: "users" }] },
    { label: "Activity", items: [{ label: "Conversations", href: "/conversations", icon: "conversations" }, { label: "Orders", href: "/orders", icon: "orders" }, { label: "Appointments", href: "/appointments", icon: "reports" }, { label: "Inquiries", href: "/inquiries", icon: "documents" }, { label: "Activity log", href: "/activity", icon: "audit" }] },
    { label: "Account", items: [{ label: "Notifications", href: "/notifications", icon: "notifications", badge: adminNotif.data?.unread || undefined }, { label: "Settings", href: "/settings", icon: "settings" }] },
  ];
  return (
    <AppShell brand={{ name: "AssistFlow", subtitle: "Platform admin", logoText: "A", color: "oklch(0.51 0.19 264)" }} user={{ name: admin.name || admin.email, email: admin.email }}
      notifications={(adminNotif.data?.items ?? []).map((n) => ({ id: n.id, title: n.title, body: n.body, at: n.createdAt, read: !!n.readAt }))} unreadCount={adminNotif.data?.unread ?? 0}
      navGroups={navGroups} homeHref="/" searchPlaceholder="Search organizations…" notificationsHref="/notifications" settingsHref="/settings" onSignOut={() => void signOut()}
      footer={<div className="rounded-lg bg-card p-3 text-xs shadow-xs"><div className="flex items-center justify-between"><span className="font-medium">Phase 1</span><Badge variant="brand">Live data</Badge></div><p className="mt-1 text-muted-foreground">{process.env.NEXT_PUBLIC_API_URL}</p></div>}>
      {children}
    </AppShell>
  );
}
export default function PortalLayout({ children }: { children: React.ReactNode }) { return <AdminProvider><Shell>{children}</Shell></AdminProvider>; }
