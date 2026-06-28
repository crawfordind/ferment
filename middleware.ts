import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/** Paths reachable without a session: the unlock screen and its API. */
const PUBLIC_PATHS = ["/unlock", "/api/unlock"];

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

  const unlockUrl = request.nextUrl.clone();
  unlockUrl.pathname = "/unlock";
  unlockUrl.search = "";
  if (pathname !== "/") {
    unlockUrl.searchParams.set("from", pathname);
  }
  return NextResponse.redirect(unlockUrl);
}

export const config = {
  // Run on everything except Next internals and public static assets, so the
  // unlock screen and PWA shell can still load while locked.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|.*\\.(?:png|svg|jpg|jpeg|gif|ico|webmanifest)$).*)",
  ],
};
