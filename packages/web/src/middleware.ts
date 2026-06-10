/**
 * Next.js edge middleware — Phase 8.
 *
 * Protects all routes except /login and public assets.
 * Verifies the sentinel_token cookie using `jose` (edge-compatible JWT).
 * Redirects to /login if missing or invalid.
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/favicon.ico", "/_next", "/api"];

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "sentinel-dev-secret-change-in-production",
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("sentinel_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Token invalid or expired — redirect to login
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("sentinel_token");
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
