"use client";
import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../lib/utils";

type Toast = { id: number; title: string; body?: string; kind: "success" | "error" | "info" };
const Ctx = React.createContext<{ push: (t: Omit<Toast, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Toast[]>([]);
  const push = React.useCallback((t: Omit<Toast, "id">) => { const id = Date.now() + Math.random(); setItems((x) => [...x, { ...t, id }]); setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), t.kind === "error" ? 7000 : 4000); }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className={cn("pointer-events-auto flex items-start gap-2 rounded-lg border bg-card p-3 shadow-lg animate-in slide-in-from-bottom-2", t.kind === "error" && "border-destructive/40")}>
            {t.kind === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : t.kind === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" /> : <Info className="mt-0.5 size-4 shrink-0 text-info" />}
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{t.title}</p>{t.body ? <p className="text-xs text-muted-foreground">{t.body}</p> : null}</div>
            <button onClick={() => setItems((x) => x.filter((i) => i.id !== t.id))} className="text-muted-foreground" aria-label="Dismiss"><X className="size-3.5" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export function useToast() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useToast outside ToastProvider");
  return { success: (title: string, body?: string) => ctx.push({ title, body, kind: "success" }), error: (title: string, body?: string) => ctx.push({ title, body, kind: "error" }), info: (title: string, body?: string) => ctx.push({ title, body, kind: "info" }) };
}
