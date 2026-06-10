/**
 * Auth middleware + JWT tests — Phase 8.
 *
 * These tests don't need a real DB — they test:
 *   1. requireAuth blocks requests with no token (401)
 *   2. requireAuth accepts a valid Bearer token
 *   3. requireRole blocks insufficient roles (403)
 *   4. requireRole passes the correct role
 *   5. Token sign/verify round-trip
 */

import express from "express";
import request from "supertest";
import cookieParser from "cookie-parser";
import { signToken, verifyToken } from "../auth/jwt";
import { requireAuth, requireRole } from "../auth/middleware";

// ---------------------------------------------------------------------------
// Minimal test app
// ---------------------------------------------------------------------------

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.get("/protected",          requireAuth,                          (_req, res) => res.json({ ok: true, role: (_req as any).user?.role }));
  app.get("/admin-only",         requireAuth, requireRole("ADMIN"),    (_req, res) => res.json({ ok: true }));
  app.get("/analyst-or-admin",   requireAuth, requireRole("ADMIN", "ANALYST"), (_req, res) => res.json({ ok: true }));

  return app;
}

// ---------------------------------------------------------------------------

const app = buildApp();

describe("requireAuth", () => {
  it("returns 401 with no token", async () => {
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
  });

  it("returns 401 with an invalid Bearer token", async () => {
    const res = await request(app).get("/protected").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("returns 200 with a valid Bearer token", async () => {
    const token = signToken({ sub: "u1", email: "a@a.com", role: "VIEWER", name: "A" });
    const res = await request(app).get("/protected").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("VIEWER");
  });
});

describe("requireRole", () => {
  it("returns 403 when VIEWER hits ADMIN-only route", async () => {
    const token = signToken({ sub: "u2", email: "v@v.com", role: "VIEWER", name: "V" });
    const res = await request(app).get("/admin-only").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("returns 200 when ADMIN hits ADMIN-only route", async () => {
    const token = signToken({ sub: "u3", email: "adm@adm.com", role: "ADMIN", name: "Ad" });
    const res = await request(app).get("/admin-only").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("returns 200 when ANALYST hits ADMIN|ANALYST route", async () => {
    const token = signToken({ sub: "u4", email: "an@an.com", role: "ANALYST", name: "An" });
    const res = await request(app).get("/analyst-or-admin").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("returns 403 when VIEWER hits ADMIN|ANALYST route", async () => {
    const token = signToken({ sub: "u5", email: "vv@vv.com", role: "VIEWER", name: "V2" });
    const res = await request(app).get("/analyst-or-admin").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe("JWT sign/verify", () => {
  it("round-trips payload correctly", () => {
    const payload = { sub: "xyz", email: "e@e.com", role: "ANALYST", name: "X" };
    const token   = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it("throws on tampered token", () => {
    const token = signToken({ sub: "x", email: "x@x.com", role: "ADMIN", name: "X" });
    expect(() => verifyToken(token + "tampered")).toThrow();
  });
});
