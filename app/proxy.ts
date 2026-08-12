import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocaleCode } from "@/lib/i18n/config";

// Next 16's middleware file — see AGENTS.md. Two independent jobs:
//   1. Locale-prefix every route that isn't under /api/** (redirect a bare path to
//      its default-locale equivalent, e.g. `/` -> `/en`, `/pl/admin` stays as-is).
//   2. The pre-existing admin auth gate, now reading the path *after* stripping the
//      locale prefix so it still recognizes `/admin/**` regardless of which locale
//      segment it's nested under.
// This is a cookie-presence check only, same as before — no session verification,
// and no handler re-checks auth; a new admin API route is protected automatically
// iff it lives under /api/admin/** or /api/cv/**.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const gated = pathname.startsWith("/api/admin/") || pathname.startsWith("/api/cv/");
    if (!gated || getSessionCookie(request)) return NextResponse.next();
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const segments = pathname.split("/");
  const firstSegment = segments[1] ?? "";

  if (!isLocaleCode(firstSegment)) {
    const suffix = pathname === "/" ? "" : pathname;
    const redirectUrl = new URL(`/${DEFAULT_LOCALE}${suffix}`, request.url);
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl, 308);
  }

  const withoutLocale = `/${segments.slice(2).join("/")}`.replace(/\/$/, "") || "/";
  const isAdminRoute = withoutLocale === "/admin" || withoutLocale.startsWith("/admin/");
  if (!isAdminRoute || withoutLocale === "/admin/login") return NextResponse.next();

  if (getSessionCookie(request)) return NextResponse.next();

  const loginUrl = new URL(`/${firstSegment}/admin/login`, request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
