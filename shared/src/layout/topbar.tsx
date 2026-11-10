"use client";

import { Bell, Command, HelpCircle, LogOut, Search, Settings, UserRound } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { UserAvatar } from "../components/user-avatar";
import { relativeTime } from "../lib/utils";

export interface TopbarNotification { id: string; title: string; body: string; at: string; read: boolean }

export function Topbar({ user, notifications, searchPlaceholder = "Search…" }: { user: { name: string; email: string }; notifications: TopbarNotification[]; searchPlaceholder?: string }) {
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <button type="button" className="flex h-9 w-full max-w-md items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent">
        <Search className="size-4" />
        <span className="flex-1 truncate text-left">{searchPlaceholder}</span>
        <kbd className="hidden items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex"><Command className="size-2.5" />K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Help"><HelpCircle /></Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell />
              {unread > 0 ? <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">{unread}</span> : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <DropdownMenuLabel className="px-3 py-2">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator className="my-0" />
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-2.5 border-b px-3 py-2.5 last:border-0">
                  <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-brand"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{relativeTime(n.at)}</p>
                  </div>
                </div>
              ))}
            </div>
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
            <DropdownMenuItem><UserRound /> Profile</DropdownMenuItem>
            <DropdownMenuItem><Settings /> Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem><LogOut /> Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
