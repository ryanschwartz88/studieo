import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // 1. Define App Routes (paths handled by Next.js)
  const isAppRoute =
    request.nextUrl.pathname.startsWith('/student') ||
    request.nextUrl.pathname.startsWith('/company') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname === '/favicon.ico';

  // 2. Handle Framer Proxy for Non-App Routes
  if (!isAppRoute) {
    const framerUrl = process.env.FRAMER_URL;

    // Only rewrite if FRAMER_URL is defined
    if (framerUrl) {
      const url = request.nextUrl.clone();
      // Construct the target URL
      const targetUrl = new URL(url.pathname, framerUrl);
      return NextResponse.rewrite(targetUrl);
    }
  }

  // 3. Supabase Auth Logic (Only runs for App Routes or if no Framer URL)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Protect App Routes: Redirect unauthenticated users to login
  if (
    isAppRoute &&
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/api") // Optional: allow public APIs
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
