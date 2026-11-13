"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@assistflow/shared/api/client";
import { supabaseBrowser } from "@assistflow/shared/api/supabase";

export interface Admin { id: string; email: string; name: string; phone: string; avatarUrl: string; notificationPrefs: Record<string, boolean>; isSuperAdmin: boolean }
const Ctx = React.createContext<{ admin: Admin; refresh: () => Promise<void>; signOut: () => Promise<void> } | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = React.useState<Admin | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();
  const signOut = React.useCallback(async () => { await supabaseBrowser().auth.signOut(); router.replace("/login"); }, [router]);
  const refresh = React.useCallback(async () => {
    try { const r = await api.get<{ admin: Admin }>("/v1/admin/me"); setAdmin(r.admin); setError(null); }
    catch (e) {
      if (e instanceof ApiError && e.status === 403) { await supabaseBrowser().auth.signOut(); router.replace("/login?error=" + encodeURIComponent("This account is not an admin account.")); return; }
      if (e instanceof ApiError && e.status === 401) { router.replace("/login"); return; }
      setError((e as Error).message || "Could not reach the API");
    }
  }, [router]);
  React.useEffect(() => { void refresh(); }, [refresh]);
  if (error) return <div className="flex min-h-dvh items-center justify-center p-8 text-center text-sm"><div><p className="font-medium text-destructive">{error}</p><p className="mt-1 text-muted-foreground">Is the backend running on {process.env.NEXT_PUBLIC_API_URL}?</p><button className="mt-4 text-brand underline" onClick={() => void refresh()}>Retry</button></div></div>;
  if (!admin) return <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  return <Ctx.Provider value={{ admin, refresh, signOut }}>{children}</Ctx.Provider>;
}
export function useAdmin() { const c = React.useContext(Ctx); if (!c) throw new Error("useAdmin outside AdminProvider"); return c; }
