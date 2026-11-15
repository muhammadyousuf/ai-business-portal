"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Command, CornerDownLeft, LogOut, Search, Settings, type LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { UserAvatar } from "../components/user-avatar";
import { cn, relativeTime } from "../lib/utils";
import { navIcons, type NavItem } from "./sidebar-nav";

export interface TopbarNotification { id: string; title: string; body: string; at: string; read: boolean; href?: string }
export interface SearchResult { label: string; hint?: string; href: string; icon?: LucideIcon }

export function Topbar({ user, notifications, searchPlaceholder = "Search…", navGroups = [], onSearch, notificationsHref, settingsHref, onSignOut, onNotificationClick, unreadCount }: {
  user: { name: string; email: string }; notifications: TopbarNotification[]; searchPlaceholder?: string; navGroups?: { label?: string; items: NavItem[] }[];
  onSearch?: (query: string) => Promise<SearchResult[]>; notificationsHref?: string; settingsHref?: string; onSignOut?: () => void; onNotificationClick?: (n: TopbarNotification) => void; unreadCount?: number;
}) {
  const unread = unreadCount ?? notifications.filter((n) => !n.read).length;
  const [searchOpen, setSearchOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen((o) => !o); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className="flex h-9 w-full max-w-md items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent">
        <Search className="size-4" />
        <span className="flex-1 truncate text-left">{searchPlaceholder}</span>
        <kbd className="hidden items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex"><Command className="size-2.5" />K</kbd>
      </button>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} navGroups={navGroups} onSearch={onSearch} placeholder={searchPlaceholder} />
      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell />
              {unread > 0 ? <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">{unread > 9 ? "9+" : unread}</span> : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">Notifications{unread ? <span className="text-xs font-normal text-muted-foreground">{unread} unread</span> : null}</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-0" />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? <p className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications yet.</p> : null}
              {notifications.map((n) => (
                <DropdownMenuItem key={n.id} className="flex items-start gap-2.5 rounded-none border-b px-3 py-2.5 last:border-0" onSelect={() => onNotificationClick?.(n)}>
                  <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-brand"}`} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", n.read ? "font-normal" : "font-medium")}>{n.title}</p>
                    {n.body ? <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p> : null}
                    <p className="mt-1 text-[11px] text-muted-foreground">{relativeTime(n.at)}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            {notificationsHref ? <><DropdownMenuSeparator className="my-0" /><DropdownMenuItem asChild className="justify-center rounded-none py-2 text-xs font-medium text-brand"><Link href={notificationsHref}>View all notifications</Link></DropdownMenuItem></> : null}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-accent" aria-label="Account menu">
              <UserAvatar name={user.name} />
              <span className="hidden text-sm font-medium md:inline">{user.name.split(" ")[0]}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {settingsHref ? <DropdownMenuItem asChild><Link href={settingsHref}><Settings /> Account settings</Link></DropdownMenuItem> : null}
            {notificationsHref ? <DropdownMenuItem asChild><Link href={notificationsHref}><Bell /> Notifications</Link></DropdownMenuItem> : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onSignOut?.()}><LogOut /> Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ⌘K palette: jumps to any page in the sidebar and, when the app provides `onSearch`, to live records (conversations, orders…).
function CommandPalette({ open, onOpenChange, navGroups, onSearch, placeholder }: { open: boolean; onOpenChange: (o: boolean) => void; navGroups: { label?: string; items: NavItem[] }[]; onSearch?: (q: string) => Promise<SearchResult[]>; placeholder: string }) {
  const router = useRouter();
  const [q, setQ] = React.useState(""); const [remote, setRemote] = React.useState<SearchResult[]>([]); const [busy, setBusy] = React.useState(false); const [active, setActive] = React.useState(0);
  React.useEffect(() => { if (!open) { setQ(""); setRemote([]); setActive(0); } }, [open]);
  React.useEffect(() => {
    if (!onSearch || q.trim().length < 2) { setRemote([]); return; }
    let cancelled = false; setBusy(true);
    const t = setTimeout(() => { onSearch(q.trim()).then((r) => { if (!cancelled) setRemote(r); }).catch(() => { if (!cancelled) setRemote([]); }).finally(() => { if (!cancelled) setBusy(false); }); }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, onSearch]);
  const pages: SearchResult[] = navGroups.flatMap((g) => g.items.map((i) => ({ label: i.label, hint: g.label, href: i.href, icon: navIcons[i.icon] })));
  const needle = q.trim().toLowerCase();
  const pageHits = needle ? pages.filter((p) => p.label.toLowerCase().includes(needle) || (p.hint ?? "").toLowerCase().includes(needle)) : pages;
  const results = [...pageHits, ...remote];
  React.useEffect(() => { setActive(0); }, [results.length, q]);
  const go = (r: SearchResult) => { onOpenChange(false); router.push(r.href); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Search" description="Jump to a page or find a record" className="p-0 [&>div:first-child]:sr-only" size="md">
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Search" className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); } if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); } if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active]); } }} />
          {busy ? <span className="text-xs text-muted-foreground">Searching…</span> : null}
        </div>
        <ul role="listbox" className="max-h-80 overflow-y-auto p-1.5">
          {results.length === 0 ? <li className="px-3 py-6 text-center text-xs text-muted-foreground">{needle ? "Nothing found." : "Type to search."}</li> : null}
          {results.map((r, i) => { const Icon = r.icon ?? CornerDownLeft; return (
            <li key={r.href + r.label} role="option" aria-selected={i === active}>
              <button type="button" onMouseEnter={() => setActive(i)} onClick={() => go(r)} className={cn("flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm", i === active ? "bg-accent" : "hover:bg-accent/60")}>
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{r.label}</span>
                {r.hint ? <span className="shrink-0 text-xs text-muted-foreground">{r.hint}</span> : null}
              </button>
            </li>); })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
