/**
 * Coverage route — Principle 3 (Evidenced, not complete).
 *
 * The coverage score and its mandatory disclaimer are always returned together.
 * The disclaimer is part of the API response so that every consumer — UI,
 * export, or downstream service — has no excuse to omit it.
 */

import { Router, Request, Response } from "express";
import type { PrismaClient } from "@prisma/client";
import { PrismaGraphRepository } from "@sentinel/db";
import { CoverageCalculator } from "@sentinel/core";

export function coverageRouter(db: PrismaClient): Router {
  const router = Router();
  const repo = new PrismaGraphRepository(db);
  const calc = new CoverageCalculator();

  router.get("/", async (_req: Request, res: Response) => {
    try {
      const nodes = await repo.listNodes();

      // Build a set of node ids that have at least one edge
      const connectedIds = new Set<string>();
      await Promise.all(
        nodes.map(async (n) => {
          const edges = await repo.getEdgesByNode(n.id);
          if (edges.length > 0) connectedIds.add(n.id);
        }),
      );

      const report = calc.compute(nodes, connectedIds);
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  return router;
}
