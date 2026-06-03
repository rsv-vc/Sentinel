import { Router, Request, Response } from "express";
import type { SyncScheduler } from "../sync/SyncScheduler";

export function syncRouter(scheduler: SyncScheduler): Router {
  const router = Router();

  // GET /api/sync/status — scheduler state + last run result
  router.get("/status", (_req: Request, res: Response) => {
    res.json(scheduler.getStatus());
  });

  // POST /api/sync — on-demand sync (replaces the old inline handler)
  router.post("/", async (_req: Request, res: Response) => {
    try {
      // Expose trigger via the scheduler so it uses the evolving connector
      (scheduler as unknown as { runSync: () => Promise<void> })["runSync" as keyof typeof scheduler];
      // Direct approach: tick + normalize
      scheduler.connector.tick();
      const { NormalizationService } = await import("@sentinel/core");
      const { PrismaGraphRepository } = await import("@sentinel/db");
      const { PrismaClient } = await import("@prisma/client");
      const db = new PrismaClient();
      const repo = new PrismaGraphRepository(db);
      const normalizer = new NormalizationService(repo);
      const result = await normalizer.normalize(scheduler.connector, "manual-trigger");
      await db.$disconnect();
      res.json({ ok: true, result });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  return router;
}
