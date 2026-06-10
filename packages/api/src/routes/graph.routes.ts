/**
 * Graph routes — read-only views into the normalised graph.
 *
 * GET /use-cases              — list all UseCase nodes
 * GET /use-cases/:id/graph   — subgraph for a single use-case (node + neighbours)
 * GET /nodes/:id/history     — append-only event history for any node
 * GET /graph/recent-events   — last N events across all nodes
 * POST /sync                 — trigger an on-demand normalization run (dev helper)
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaGraphRepository } from "@sentinel/db";
import { NormalizationService } from "@sentinel/core";
import { MockCloudConnector, ConnectorRegistry } from "@sentinel/connectors";

export function graphRouter(db: PrismaClient): Router {
  const router = Router();
  const repo = new PrismaGraphRepository(db);

  // Shared registry + connector (Phase 4 will move this to the sync worker)
  const registry = new ConnectorRegistry();
  const mockConnector = new MockCloudConnector();
  registry.register(mockConnector, [
    "read:assets",
    "read:models",
    "read:grants",
    "read:egress",
  ]);
  const normalizer = new NormalizationService(repo);

  // -------------------------------------------------------------------------
  // GET /use-cases
  // -------------------------------------------------------------------------
  router.get("/use-cases", async (_req: Request, res: Response) => {
    try {
      const nodes = await repo.listNodes("USE_CASE");
      res.json({ data: nodes, count: nodes.length });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /use-cases/:id/graph
  // Returns the use-case node plus all directly connected nodes and edges.
  // -------------------------------------------------------------------------
  router.get("/use-cases/:id/graph", async (req: Request, res: Response) => {
    try {
      const root = await repo.getNodeWithEdges(req.params.id);
      if (!root) {
        res.status(404).json({ error: "Use-case not found" });
        return;
      }

      // Collect all connected node ids
      const connectedIds = new Set<string>();
      for (const e of root.edgesFrom) connectedIds.add(e.toId);
      for (const e of root.edgesTo) connectedIds.add(e.fromId);

      // Fetch neighbour nodes
      const neighbours = await Promise.all(
        [...connectedIds].map((id) => repo.getNode(id)),
      );

      res.json({
        root,
        neighbours: neighbours.filter(Boolean),
        edges: [...root.edgesFrom, ...root.edgesTo],
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /nodes/:id/graph
  // Returns any node + all directly connected nodes and edges.
  // -------------------------------------------------------------------------
  router.get("/nodes/:id/graph", async (req: Request, res: Response) => {
    try {
      const root = await repo.getNodeWithEdges(req.params.id);
      if (!root) {
        res.status(404).json({ error: "Node not found" });
        return;
      }

      const connectedIds = new Set<string>();
      for (const e of root.edgesFrom) connectedIds.add(e.toId);
      for (const e of root.edgesTo)   connectedIds.add(e.fromId);

      const neighbours = await Promise.all(
        [...connectedIds].map((id) => repo.getNode(id)),
      );

      res.json({
        root,
        neighbours: neighbours.filter(Boolean),
        edges: [...root.edgesFrom, ...root.edgesTo],
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /nodes/:id/history
  // -------------------------------------------------------------------------
  router.get("/nodes/:id/history", async (req: Request, res: Response) => {
    try {
      const node = await repo.getNode(req.params.id);
      if (!node) {
        res.status(404).json({ error: "Node not found" });
        return;
      }
      const events = await repo.getNodeHistory(req.params.id);
      res.json({ node, events, count: events.length });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /graph/recent-events
  // -------------------------------------------------------------------------
  router.get("/graph/recent-events", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(Number(req.query.limit ?? 50), 200);
      const events = await repo.listRecentEvents(limit);
      res.json({ data: events, count: events.length });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // POST /sync  — dev/demo helper; triggers a normalization run
  // -------------------------------------------------------------------------
  router.post("/sync", async (_req: Request, res: Response) => {
    try {
      registry.markSyncing(mockConnector.id);
      const result = await normalizer.normalize(mockConnector);
      registry.recordSync(mockConnector.id, { status: "idle" });
      res.json({ ok: true, result });
    } catch (err) {
      registry.recordSync(mockConnector.id, {
        status: "error",
        error: String(err),
      });
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /connectors  — registry status
  // -------------------------------------------------------------------------
  router.get("/connectors", (_req: Request, res: Response) => {
    const records = registry.list().map((r) => ({
      id: r.connector.id,
      name: r.connector.name,
      scope: r.scope,
      status: r.status,
      lastSyncAt: r.lastSyncAt,
      lastError: r.lastError,
    }));
    res.json({ data: records, count: records.length });
  });

  return router;
}
