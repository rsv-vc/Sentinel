/**
 * Auth middleware — Phase 8.
 *
 * requireAuth   — 401 if no valid JWT in cookie or Bearer header.
 * requireRole   — 403 if authenticated user's role is not in the allowed set.
 *
 * Role hierarchy:
 *   ADMIN   → full access
 *   ANALYST → read + rectify + confirm + sync
 *   VIEWER  → read-only (GET routes only)
 */

import type { Request, Response, NextFunction } from "express";
import { verifyToken, COOKIE } from "./jwt";
import type { JwtPayload } from "./jwt";

// Extend Express Request so downstream handlers can read req.user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const cookieToken  = req.cookies?.[COOKIE] as string | undefined;
  const bearerToken  = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = cookieToken ?? bearerToken;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Insufficient permissions. Required: ${roles.join(" | ")}. Your role: ${req.user.role}`,
      });
      return;
    }
    next();
  };
}
