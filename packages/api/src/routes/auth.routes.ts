/**
 * Auth routes — Phase 8.
 *
 * POST /auth/login    — email + password → JWT in httpOnly cookie + JSON body
 * GET  /auth/me       — current user (requires auth)
 * POST /auth/logout   — clear cookie
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { compareSync } from "bcryptjs";
import { signToken, COOKIE } from "../auth/jwt";
import { requireAuth } from "../auth/middleware";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure:   process.env.NODE_ENV === "production",
  maxAge:   8 * 60 * 60 * 1000, // 8 hours
  path:     "/",
};

export function authRouter(db: PrismaClient): Router {
  const router = Router();

  // -------------------------------------------------------------------------
  // POST /auth/login
  // -------------------------------------------------------------------------
  router.post("/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body ?? {};
      if (!email || !password) {
        res.status(400).json({ error: "email and password are required" });
        return;
      }

      const user = await db.user.findUnique({ where: { email: String(email).toLowerCase() } });
      if (!user || !compareSync(String(password), user.passwordHash)) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const token = signToken({ sub: user.id, email: user.email, role: user.role, name: user.name });

      res
        .cookie(COOKIE, token, COOKIE_OPTS)
        .json({
          ok: true,
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          token, // also returned in body for non-browser clients
        });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /auth/me
  // -------------------------------------------------------------------------
  router.get("/me", requireAuth, (req: Request, res: Response) => {
    res.json({ user: req.user });
  });

  // -------------------------------------------------------------------------
  // POST /auth/logout
  // -------------------------------------------------------------------------
  router.post("/logout", (_req: Request, res: Response) => {
    res.clearCookie(COOKIE, { path: "/" }).json({ ok: true });
  });

  return router;
}
