import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import { PrismaGraphRepository } from "@sentinel/db";
import { graphRouter } from "./routes/graph.routes";
import { nodesRouter } from "./routes/nodes.routes";
import { coverageRouter } from "./routes/coverage.routes";
import { syncRouter } from "./routes/sync.routes";
import { riskRouter } from "./routes/risk.routes";
import { reportsRouter } from "./routes/reports.routes";
import { rectificationsRouter } from "./routes/rectifications.routes";
import { authRouter } from "./routes/auth.routes";
import { requireAuth, requireRole } from "./auth/middleware";
import { SyncScheduler } from "./sync/SyncScheduler";

const app  = express();
const PORT = Number(process.env.PORT ?? 3001);
const db   = new PrismaClient();
const repo = new PrismaGraphRepository(db);

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------
const scheduler = new SyncScheduler(repo);
scheduler.start();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors({
  origin:      process.env.WEB_ORIGIN ?? "http://localhost:3000",
  credentials: true,   // required for cookies
}));
app.use(express.json());
app.use(cookieParser());

// ---------------------------------------------------------------------------
// Public routes  (no auth)
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sentinel-api", ts: new Date().toISOString() });
});
app.use("/api/auth", authRouter(db));

// ---------------------------------------------------------------------------
// Protected routes  (requireAuth applied globally from here)
// ---------------------------------------------------------------------------
app.use(requireAuth);

// Read-accessible to all authenticated roles
app.use("/api", graphRouter(db));
app.use("/api/nodes", nodesRouter(db));
app.use("/api/coverage", coverageRouter(db));
app.use("/api", riskRouter(db));
app.use("/api/reports", reportsRouter(db, scheduler));

// ANALYST + ADMIN: sync, confirm, rectify
app.use("/api/sync",            requireRole("ADMIN", "ANALYST"), syncRouter(scheduler));
app.use("/api/rectifications",  requireRole("ADMIN", "ANALYST"), rectificationsRouter(db));

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
function shutdown() {
  console.log("[api] Shutting down…");
  scheduler.stop();
  db.$disconnect().then(() => process.exit(0));
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[api] sync interval: ${scheduler.intervalMs}ms`);
  console.log(`[api] auth: enabled  (JWT httpOnly cookie)`);
});

export { app, db };
