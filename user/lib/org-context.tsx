"use client";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@assistflow/shared/api/client";

export interface Org { id: string; uuid: string; name: string; slug: string; categoryKey: string; description: string; logoUrl: string; website: string; phone: string; email: string; address: Record<string, string>; timezone: string; currency: string; ownerUserId: string; status: string; widgetKey: string; allowedOrigins: string[]; memberCount: number; role: "owner" | "member"; category: { key: string; name: string; modules: string[]; labels: Record<string, string>; inquiryTypes: string[] } | null }
const Ctx = React.createContext<{ org: Org; base: string; isOwner: boolean; has: (m: string) => boolean; label: (k: string, fallback?: string) => string; refresh: () => Promise<void> } | null>(null);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { orgId } = useParams<{ orgId: string }>(); const router = useRouter();
  const [org, setOrg] = React.useState<Org | null>(null); const [error, setError] = React.useState<string | null>(null);
  const refresh = React.useCallback(async () => {
    try { const r = await api.get<{ organization: Org }>(`/v1/orgs/${orgId}`); setOrg(r.organization); setError(null); }
    catch (e) { if (e instanceof ApiError && (e.status === 403 || e.status === 404)) { setError(e.message); return; } setError((e as Error).message); }
  }, [orgId]);
  React.useEffect(() => { void refresh(); }, [refresh]);
  if (error) return <div className="flex min-h-[60vh] items-center justify-center p-8 text-center text-sm"><div><p className="font-medium text-destructive">{error}</p><button className="mt-4 text-brand underline" onClick={() => router.replace("/organizations")}>Choose another organization</button></div></div>;
  if (!org) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading organization…</div>;
  const mods = new Set(org.category?.modules ?? []);
  return <Ctx.Provider value={{ org, base: `/org/${org.uuid}`, isOwner: org.role === "owner", has: (m) => mods.has(m), label: (k, fb) => org.category?.labels?.[k] ?? fb ?? k, refresh }}>{children}</Ctx.Provider>;
}
export function useOrg() { const c = React.useContext(Ctx); if (!c) throw new Error("useOrg outside OrgProvider"); return c; }
