"use client";
import { accessToken } from "./supabase";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string, public details?: Record<string, string[]>) { super(message); }
}

const BASE = () => (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

async function request<T>(method: string, path: string, body?: unknown, opts: { form?: FormData; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.auth !== false) { const t = await accessToken(); if (t) headers.Authorization = `Bearer ${t}`; }
  if (body !== undefined && !opts.form) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE()}${path}`, { method, headers, body: opts.form ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!res.ok) throw new ApiError(res.status, (data.error as string) ?? res.statusText, data.code as string | undefined, data.details as Record<string, string[]> | undefined);
  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: { auth?: boolean }) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: { auth?: boolean }) => request<T>("POST", path, body, opts),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
  upload: <T>(path: string, file: File, field = "file") => { const form = new FormData(); form.append(field, file); return request<T>("POST", path, undefined, { form }); },
};

export const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : "";
};
