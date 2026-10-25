// Runs before every page request.
//
// /admin…  Refreshes the Supabase session cookie and sends signed-out visitors to the login page.
//          This is only an optimistic check — every admin page and server action verifies the session
//          and admin membership again (src/lib/admin/session.ts), and RLS does too.
//
// Public site: English lives at unprefixed URLs (/visas), French at /fr/…, Arabic at /ar/….
//   /fr/… /ar/…   served as is
//   /en/…         redirected to the unprefixed URL (one address per page)
//   everything else → internally rewritten to /en/…, unless the visitor's saved choice (switcher
//                     cookie) or, on a first visit, their browser language asks for fr/ar → redirect.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { LOCALE_COOKIE, defaultLocale, isLocale, localizedPath, negotiateLocale } from "@/i18n/config";

const LOGIN_PATH = "/admin/login";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return adminProxy(request);
  return localeProxy(request);
}

function localeProxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const [, first] = url.pathname.split("/");

  if (first === defaultLocale) {
    url.pathname = url.pathname.slice(defaultLocale.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (isLocale(first)) return NextResponse.next();

  // Unprefixed = English, unless this visitor prefers French/Arabic (only for page views).
  if (request.method === "GET" && !request.headers.has("next-action")) {
    const saved = request.cookies.get(LOCALE_COOKIE)?.value;
    const preferred = isLocale(saved) ? saved : negotiateLocale(request.headers.get("accept-language"));
    if (preferred && preferred !== defaultLocale) {
      url.pathname = localizedPath(preferred, url.pathname);
      return NextResponse.redirect(url);
    }
  }
  url.pathname = `/${defaultLocale}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

async function adminProxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Verifies the JWT (and refreshes it when expired) — don't put code between createServerClient and this.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (target: URL) => {
    const redirect = NextResponse.redirect(target);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!signedIn && pathname !== LOGIN_PATH) {
    const login = new URL(LOGIN_PATH, request.url);
    login.searchParams.set("next", pathname + search);
    return redirectTo(login);
  }
  if (signedIn && pathname === LOGIN_PATH) {
    return redirectTo(new URL("/admin", request.url));
  }
  return response;
}

export const config = {
  // Everything except Next internals, files with an extension and generated metadata images.
  matcher: ["/((?!_next/|api/|opengraph-image|.*\\.[a-zA-Z0-9]+$).*)"],
};
