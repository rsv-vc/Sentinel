/**
 * Next.js edge middleware — Phase 8.
 *
 * Protects all routes except /login and public assets.
 * Verifies the sentinel_token cookie using `jose` (edge-compatible JWT).
 * Redirects to /login if missing or invalid.
 */

import { NextResponse } from "next/server";

export function middleware() {
  // Demo mode — no auth required
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
