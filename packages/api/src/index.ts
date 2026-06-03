import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { PrismaGraphRepository } from "@sentinel/db";
import { graphRouter } from "./routes/graph.routes";
import { nodesRouter } from "./routes/nodes.routes";
import { coverageRouter } from "./routes/coverage.routes";
import { syncRouter } from "./routes/sync.routes";
import { SyncScheduler } from "./sync/SyncScheduler";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const db = new PrismaClient();
const repo = new PrismaGraphRepository(db);

// ---------------------------------------------------------------------------
// Scheduler — start background sync immediately
// ---------------------------------------------------------------------------
const scheduler = new SyncScheduler(repo);
scheduler.start();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sentinel-api", ts: new Date().toISOString() });
});

app.use("/api", graphRouter(db));
app.use("/api/nodes", nodesRouter(db));
app.use("/api/coverage", coverageRouter(db));
app.use("/api/sync", syncRouter(scheduler));

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
});

export { app, db };
