/**
 * JWT helpers — Phase 8.
 * Secret read from JWT_SECRET env (falls back to a dev-only default).
 */

import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "sentinel-dev-secret-change-in-production";
const EXPIRY  = "8h";
const COOKIE  = "sentinel_token";

export { COOKIE };

export interface JwtPayload {
  sub:   string;   // userId
  email: string;
  role:  string;
  name:  string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
