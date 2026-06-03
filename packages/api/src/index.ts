import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { graphRouter } from "./routes/graph.routes";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const db = new PrismaClient();

app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "sentinel-api",
    ts: new Date().toISOString(),
  });
});

app.use("/api", graphRouter(db));

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[api] routes: GET /health, /api/use-cases, /api/connectors, POST /api/sync`);
});

export { app, db };
