"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "./client";

// Minimal data hook: fetch on mount / when the path changes, expose refetch and optimistic setData.
export function useApi<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(!!path);
  const seq = useRef(0);
  const refetch = useCallback(async () => {
    if (!path) { setData(null); setLoading(false); return; }
    const my = ++seq.current; setLoading(true);
    try { const d = await api.get<T>(path); if (my === seq.current) { setData(d); setError(null); } }
    catch (e) { if (my === seq.current) setError(e instanceof ApiError ? e : new ApiError(0, (e as Error).message)); }
    finally { if (my === seq.current) setLoading(false); }
  }, [path]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void refetch(); }, [refetch, ...deps]);
  return { data, error, loading, refetch, setData };
}

// Polls while mounted (used by the inbox for new messages).
export function usePolling(fn: () => Promise<void> | void, ms: number, enabled = true) {
  useEffect(() => { if (!enabled) return; const id = setInterval(() => { void fn(); }, ms); return () => clearInterval(id); }, [fn, ms, enabled]);
}
