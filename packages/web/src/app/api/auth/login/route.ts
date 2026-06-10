/**
 * POST /api/auth/login
 *
 * Next.js API route that proxies the login request to the Express API,
 * then sets the sentinel_token cookie on the SAME origin as the web app
 * (localhost:3000). This avoids the cross-port cookie issue where browsers
 * won't share cookies between localhost:3001 and localhost:3000.
 */

import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Forward to the Express auth endpoint
    const apiRes = await fetch(`${API}/api/auth/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(data, { status: apiRes.status });
    }

    // Set the cookie from the Next.js origin so middleware can read it
    const response = NextResponse.json(data, { status: 200 });
    response.cookies.set("sentinel_token", data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure:   process.env.NODE_ENV === "production",
      maxAge:   8 * 60 * 60, // 8 hours in seconds
      path:     "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: `Login proxy error: ${String(err)}` },
      { status: 500 },
    );
  }
}
