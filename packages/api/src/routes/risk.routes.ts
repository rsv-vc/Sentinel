/**
 * Risk & Compliance routes — Phase 5.
 *
 * GET /use-cases/:id/risk        — risk report for a single use-case
 * GET /use-cases/:id/compliance  — compliance obligations & gaps for a use-case
 * GET /risk/portfolio            — portfolio-level concentration & summary
 *
 * All responses include a disclaimer where applicable (Principle 5).
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaGraphRepository } from "@sentinel/db";
import { RiskEngine, ComplianceEngine } from "@sentinel/core";

export function riskRouter(db: PrismaClient): Router {
  const router = Router();
  const repo   = new PrismaGraphRepository(db);
  const risk   = new RiskEngine(repo);
  const comp   = new ComplianceEngine(repo);

  // -------------------------------------------------------------------------
  // GET /use-cases/:id/risk
  // -------------------------------------------------------------------------
  router.get("/use-cases/:id/risk", async (req: Request, res: Response) => {
    try {
      const node = await repo.getNode(req.params.id);
      if (!node || node.type !== "USE_CASE") {
        res.status(404).json({ error: "Use-case not found" });
        return;
      }
      const report = await risk.scoreUseCase(node);
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /use-cases/:id/compliance
  // -------------------------------------------------------------------------
  router.get("/use-cases/:id/compliance", async (req: Request, res: Response) => {
    try {
      const node = await repo.getNode(req.params.id);
      if (!node || node.type !== "USE_CASE") {
        res.status(404).json({ error: "Use-case not found" });
        return;
      }
      const report = await comp.assessUseCase(node);
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /risk/portfolio
  // -------------------------------------------------------------------------
  router.get("/risk/portfolio", async (_req: Request, res: Response) => {
    try {
      const report = await risk.portfolioReport();
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  return router;
}
