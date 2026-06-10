/**
 * POST /api/auth/logout
 *
 * Clears the sentinel_token cookie from the Next.js origin.
 */

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("sentinel_token");
  return response;
}
