import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/forgot-password", "/reset-password", "/auth/callback", "/auth/confirm"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: { name: process.env.NEXT_PUBLIC_SUPABASE_COOKIE_NAME || undefined },
    cookies: { getAll: () => req.cookies.getAll(), setAll: (all) => { all.forEach(({ name, value }) => req.cookies.set(name, value)); res = NextResponse.next({ request: req }); all.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); } },
  });
  // Route gating only: the API verifies every token itself. Reading the session from the cookie (refreshing it
  // when expired) avoids a network round-trip to Supabase on every navigation, which used to log people out on
  // any transient failure of that call. A missing or unrefreshable session still redirects to sign-in.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path.startsWith(p));
  if (!user && !isPublic) { const url = req.nextUrl.clone(); url.pathname = "/login"; url.searchParams.set("next", path); return NextResponse.redirect(url); }
  if (user && path === "/login") { const url = req.nextUrl.clone(); url.pathname = "/"; url.search = ""; return NextResponse.redirect(url); }
  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
