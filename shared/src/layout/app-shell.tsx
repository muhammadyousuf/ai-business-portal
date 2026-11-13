import Link from "next/link";
import { BrandMark } from "../components/brand-mark";
import { TooltipProvider } from "../ui/tooltip";
import { SidebarNav, type NavItem } from "./sidebar-nav";
import { Topbar, type TopbarNotification } from "./topbar";

export function AppShell({
  brand,
  user,
  notifications,
  navGroups,
  homeHref,
  footer,
  searchPlaceholder,
  notificationsHref,
  settingsHref,
  onSignOut,
  unreadCount,
  children,
}: {
  brand: { name: string; subtitle: string; logoText: string; color: string };
  user: { name: string; email: string };
  notifications: TopbarNotification[];
  navGroups: { label?: string; items: NavItem[] }[];
  homeHref: string;
  footer?: React.ReactNode;
  searchPlaceholder?: string;
  notificationsHref?: string;
  settingsHref?: string;
  onSignOut?: () => void;
  unreadCount?: number;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="flex min-h-dvh"
        style={{ "--brand": brand.color, "--brand-soft": `color-mix(in oklch, ${brand.color} 12%, var(--card))` } as React.CSSProperties}
      >
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
          <Link href={homeHref} className="flex h-14 items-center gap-2.5 border-b px-4 hover:bg-accent/60">
            <BrandMark text={brand.logoText} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">{brand.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{brand.subtitle}</p>
            </div>
          </Link>
          <SidebarNav groups={navGroups} />
          {footer ? <div className="border-t p-3">{footer}</div> : null}
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} notifications={notifications} searchPlaceholder={searchPlaceholder} notificationsHref={notificationsHref} settingsHref={settingsHref} onSignOut={onSignOut} unreadCount={unreadCount} />
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
