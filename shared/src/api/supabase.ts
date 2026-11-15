"use client";
import { createBrowserClient } from "@supabase/ssr";

// Each app sets its own cookie name (NEXT_PUBLIC_SUPABASE_COOKIE_NAME) so the admin and client
// portals never share a session when they run on the same hostname (cookies ignore the port).
export const cookieName = () => process.env.NEXT_PUBLIC_SUPABASE_COOKIE_NAME || undefined;

let client: ReturnType<typeof createBrowserClient> | null = null;
export function supabaseBrowser() {
  if (!client) client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookieOptions: { name: cookieName() } });
  return client;
}

// Returns a valid access token, refreshing first if it expires within 60 seconds (e.g. after the laptop slept).
export async function accessToken(forceRefresh = false) {
  const sb = supabaseBrowser();
  const { data } = await sb.auth.getSession();
  let session = data.session;
  if (!session) return null;
  const expiresSoon = (session.expires_at ?? 0) * 1000 - Date.now() < 60_000;
  if (forceRefresh || expiresSoon) { const r = await sb.auth.refreshSession(); session = r.data.session ?? session; }
  return session?.access_token ?? null;
}
