import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

// Confirms a one-time link from our own emails (password reset) server-side, setting the session cookie.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/reset-password";
  if (!tokenHash || !type) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Invalid link")}`, url.origin));
  const store = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookieOptions: { name: process.env.NEXT_PUBLIC_SUPABASE_COOKIE_NAME || undefined }, cookies: { getAll: () => store.getAll(), setAll: (all) => all.forEach(({ name, value, options }) => store.set(name, value, options)) } });
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) return NextResponse.redirect(new URL(`/reset-password?error=${encodeURIComponent("This link is invalid or has expired. Request a new one.")}`, url.origin));
  return NextResponse.redirect(new URL(next, url.origin));
}
