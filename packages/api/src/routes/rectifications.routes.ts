/**
 * Rectification routes — Phase 7.
 *
 * Principle 1: "rectify, not transfer" — all actions are remediation-oriented.
 *   No insurance, no risk-transfer, no brokering.
 *
 * POST   /rectifications                    — open a new rectification
 * GET    /rectifications                    — list (filter by nodeId, status, obligationId)
 * GET    /rectifications/:id                — get with evidence
 * PATCH  /rectifications/:id               — update title/description/priority/dueDate/status
 * POST   /rectifications/:id/resolve       — mark resolved (writes resolvedAt)
 * POST   /rectifications/:id/evidence      — file a piece of evidence (append-only)
 * GET    /rectifications/:id/evidence      — list evidence for a rectification
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaRectificationRepository } from "@sentinel/db";
import type { RectificationStatus } from "@sentinel/db";

export function rectificationsRouter(db: PrismaClient): Router {
  const router = Router();
  const repo   = new PrismaRectificationRepository(db);

  // -------------------------------------------------------------------------
  // POST /rectifications
  // -------------------------------------------------------------------------
  router.post("/", async (req: Request, res: Response) => {
    try {
      const { title, description, nodeId, obligationId, dimensionId, priority, actor, dueDate } = req.body;
      if (!title) { res.status(400).json({ error: "title is required" }); return; }
      const rect = await repo.create({
        title, description, nodeId, obligationId, dimensionId, priority,
        actor: actor ?? "user",
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      res.status(201).json(rect);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /rectifications
  // -------------------------------------------------------------------------
  router.get("/", async (req: Request, res: Response) => {
    try {
      const { nodeId, status, obligationId } = req.query;
      const items = await repo.list({
        nodeId:       nodeId       as string | undefined,
        status:       status       as RectificationStatus | undefined,
        obligationId: obligationId as string | undefined,
      });
      res.json({ data: items, count: items.length });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /rectifications/:id
  // -------------------------------------------------------------------------
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const rect = await repo.get(req.params.id);
      if (!rect) { res.status(404).json({ error: "Not found" }); return; }
      res.json(rect);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // PATCH /rectifications/:id
  // -------------------------------------------------------------------------
  router.patch("/:id", async (req: Request, res: Response) => {
    try {
      const { title, description, priority, status, dueDate } = req.body;
      const rect = await repo.update(req.params.id, {
        title, description, priority, status,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      });
      res.json(rect);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // POST /rectifications/:id/resolve
  // -------------------------------------------------------------------------
  router.post("/:id/resolve", async (req: Request, res: Response) => {
    try {
      const { actor } = req.body;
      const rect = await repo.resolve(req.params.id, actor ?? "user");
      res.json(rect);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // POST /rectifications/:id/evidence
  // -------------------------------------------------------------------------
  router.post("/:id/evidence", async (req: Request, res: Response) => {
    try {
      const { content, actor } = req.body;
      if (!content) { res.status(400).json({ error: "content is required" }); return; }
      const ev = await repo.fileEvidence({
        rectificationId: req.params.id,
        content,
        actor: actor ?? "user",
      });
      res.status(201).json(ev);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /rectifications/:id/evidence
  // -------------------------------------------------------------------------
  router.get("/:id/evidence", async (req: Request, res: Response) => {
    try {
      const items = await repo.listEvidence(req.params.id);
      res.json({ data: items, count: items.length });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  return router;
}
