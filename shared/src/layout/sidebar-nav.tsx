"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Bell, BookOpen, Bot, Building2, CreditCard, FileText, History, Inbox, LayoutDashboard, LifeBuoy,
  Megaphone, Package, Plug, Receipt, Settings, Shield, ShoppingCart, Sparkles, Store, Users, Wallet, type LucideIcon,
} from "lucide-react";
import { cn } from "../lib/utils";

export const navIcons = {
  dashboard: LayoutDashboard, businesses: Building2, users: Users, plans: CreditCard, revenue: Wallet, invoices: Receipt,
  conversations: Inbox, orders: ShoppingCart, ai: Sparkles, reports: BarChart3, notifications: Bell, support: LifeBuoy,
  roles: Shield, settings: Settings, audit: History, catalog: Package, knowledge: BookOpen, assistant: Bot, channels: Plug,
  staff: Users, billing: CreditCard, store: Store, campaigns: Megaphone, documents: FileText,
} satisfies Record<string, LucideIcon>;

export interface NavItem {
  label: string;
  href: string;
  icon: keyof typeof navIcons;
  badge?: string | number;
  exact?: boolean;
}

export function SidebarNav({ groups }: { groups: { label?: string; items: NavItem[] }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4 scrollbar-thin">
      {groups.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {group.label ? (
            <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{group.label}</p>
          ) : null}
          {group.items.map((item) => {
            const Icon = navIcons[item.icon];
            const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex h-8 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition-colors",
                  active ? "bg-brand-soft text-brand" : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className={cn("size-4 shrink-0", active ? "text-brand" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="truncate">{item.label}</span>
                {item.badge !== undefined ? (
                  <span className={cn("ml-auto rounded-full px-1.5 text-[11px] tabular", active ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground")}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
