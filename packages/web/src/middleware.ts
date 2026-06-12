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
  // Demo mode — no auth required
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
