import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Paths reachable without a session: the login screen + auth API, the public
 * editorial content (blog + knowledge base, which touch no user data), and the
 * crawler files. Everything else — the dashboard and all batch data — stays
 * gated.
 */
const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/blog",
  "/knowledge",
  "/sitemap.xml",
  "/robots.txt",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.APP_SECRET;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (secret && (await verifySessionToken(token, secret))) {
    return NextResponse.next();
  }

  // API callers get a clean 401 rather than an HTML redirect.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  if (pathname !== "/") {
    loginUrl.searchParams.set("from", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on everything except Next internals and public static assets, so the
  // unlock screen and PWA shell can still load while locked.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|.*\\.(?:png|svg|jpg|jpeg|gif|ico|webmanifest)$).*)",
  ],
};
