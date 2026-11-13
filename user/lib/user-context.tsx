"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@assistflow/shared/api/client";
import { supabaseBrowser } from "@assistflow/shared/api/supabase";

export interface Me { id: string; email: string; name: string; phone: string; avatarUrl: string; notificationPrefs: Record<string, boolean> }
export interface MyOrg { id: string; uuid: string; name: string; slug: string; categoryKey: string; logoUrl: string; status: string; role: "owner" | "member"; category: { key: string; name: string; modules: string[]; labels: Record<string, string> } | null }
const Ctx = React.createContext<{ me: Me; orgs: MyOrg[]; refresh: () => Promise<void>; signOut: () => Promise<void> } | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = React.useState<Me | null>(null); const [orgs, setOrgs] = React.useState<MyOrg[]>([]); const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();
  const signOut = React.useCallback(async () => { await supabaseBrowser().auth.signOut(); router.replace("/login"); }, [router]);
  const refresh = React.useCallback(async () => {
    try { const [m, o] = await Promise.all([api.get<{ user: Me }>("/v1/me"), api.get<{ items: MyOrg[] }>("/v1/me/organizations")]); setMe(m.user); setOrgs(o.items); setError(null); }
    catch (e) { if (e instanceof ApiError && e.status === 401) { router.replace("/login"); return; } setError((e as Error).message || "Could not reach the API"); }
  }, [router]);
  React.useEffect(() => { void refresh(); }, [refresh]);
  if (error) return <div className="flex min-h-dvh items-center justify-center p-8 text-center text-sm"><div><p className="font-medium text-destructive">{error}</p><p className="mt-1 text-muted-foreground">Is the backend running on {process.env.NEXT_PUBLIC_API_URL}?</p><button className="mt-4 text-brand underline" onClick={() => void refresh()}>Retry</button></div></div>;
  if (!me) return <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  return <Ctx.Provider value={{ me, orgs, refresh, signOut }}>{children}</Ctx.Provider>;
}
export function useUser() { const c = React.useContext(Ctx); if (!c) throw new Error("useUser outside UserProvider"); return c; }
