import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { graphRouter } from "./routes/graph.routes";
import { nodesRouter } from "./routes/nodes.routes";
import { coverageRouter } from "./routes/coverage.routes";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const db = new PrismaClient();

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

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[api] POST /api/sync · GET /api/use-cases · GET /api/coverage · /api/nodes`);
});

export { app, db };
