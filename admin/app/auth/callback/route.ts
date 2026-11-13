import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

// Exchanges the PKCE code from a Supabase email link (password recovery) for a session, then continues.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/reset-password";
  const store = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => store.getAll(), setAll: (all) => all.forEach(({ name, value, options }) => store.set(name, value, options)) } });
  if (code) { const { error } = await supabase.auth.exchangeCodeForSession(code); if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin)); }
  return NextResponse.redirect(new URL(next, url.origin));
}
