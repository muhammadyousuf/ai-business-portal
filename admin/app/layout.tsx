import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@assistflow/shared/layout/app-shell";
import type { NavItem } from "@assistflow/shared/layout/sidebar-nav";
import { Badge } from "@assistflow/shared/ui/badge";
import { PRODUCT_NAME, invoices, platformUsers, tickets } from "@assistflow/shared/mock/platform";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "AssistFlow Admin", template: "%s · AssistFlow Admin" },
  description: "Platform admin for AssistFlow. Demo build with synthetic data.",
};

const notifications = [
  { id: "n1", title: "Payment overdue 19 days", body: "Electric World (Pro) auto-suspended this morning. Ticket tk_2 is waiting on the customer.", at: "2026-10-31T07:10:00Z", read: false },
  { id: "n2", title: "New support ticket", body: "City Grammar School: how do we add fee structure per class?", at: "2026-10-30T09:20:00Z", read: false },
  { id: "n3", title: "Trial ending in 3 days", body: "City Grammar School trial ends 3 Nov. 143 AI replies used.", at: "2026-10-30T08:00:00Z", read: true },
];

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const openTickets = tickets.filter((t) => t.status !== "resolved").length;
  const unpaid = invoices.filter((i) => i.status === "due" || i.status === "overdue").length;
  const navGroups: { label?: string; items: NavItem[] }[] = [
    { items: [{ label: "Dashboard", href: "/", icon: "dashboard", exact: true }] },
    {
      label: "Customers",
      items: [
        { label: "Businesses", href: "/businesses", icon: "businesses" },
        { label: "Subscriptions & Plans", href: "/plans", icon: "plans" },
        { label: "Payments & Revenue", href: "/revenue", icon: "revenue" },
        { label: "Invoices", href: "/invoices", icon: "invoices", badge: unpaid },
      ],
    },
    {
      label: "Activity",
      items: [
        { label: "All Conversations", href: "/conversations", icon: "conversations" },
        { label: "All Orders & Inquiries", href: "/orders", icon: "orders" },
        { label: "AI Usage & Monitoring", href: "/ai-usage", icon: "ai" },
        { label: "Reports & Analytics", href: "/reports", icon: "reports" },
      ],
    },
    {
      label: "Platform",
      items: [
        { label: "Support & Tickets", href: "/support", icon: "support", badge: openTickets },
        { label: "Audit Logs", href: "/audit", icon: "audit" },
        { label: "Settings & Roles", href: "/settings", icon: "settings" },
      ],
    },
  ];
  const me = platformUsers[0];

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh font-sans`}>
        <AppShell
          brand={{ name: PRODUCT_NAME, subtitle: "Platform admin", logoText: "A", color: "oklch(0.51 0.19 264)" }}
          user={{ name: me.name, email: me.email }}
          notifications={notifications}
          navGroups={navGroups}
          homeHref="/"
          searchPlaceholder="Search businesses, invoices, conversations…"
          footer={
            <div className="rounded-lg bg-card p-3 text-xs shadow-xs">
              <div className="mb-1 flex items-center justify-between"><span className="font-medium">Environment</span><Badge variant="warning">Demo data</Badge></div>
              <p className="text-muted-foreground">admin.assistflow.app</p>
            </div>
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
