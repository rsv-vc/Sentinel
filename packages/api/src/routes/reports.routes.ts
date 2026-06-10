/**
 * Reports routes — Phase 6.
 *
 * GET /reports/board         — full BoardReport JSON
 * GET /reports/board.csv     — CSV download (Excel / Sheets compatible)
 * GET /reports/board.pdf     — PDF download (CRO/CISO board pack)
 *
 * All formats include coverage score + blind spots (Principle 3) and the
 * compliance disclaimer (Principle 5).
 */

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaGraphRepository } from "@sentinel/db";
import { BoardReportBuilder } from "@sentinel/core";
import { renderBoardReportPdf } from "../reports/pdf.renderer";
import { renderBoardReportCsv } from "../reports/csv.renderer";
import type { SyncScheduler } from "../sync/SyncScheduler";

export function reportsRouter(db: PrismaClient, scheduler?: SyncScheduler): Router {
  const router = Router();
  const repo   = new PrismaGraphRepository(db);

  async function buildReport() {
    const builder = new BoardReportBuilder(repo);
    return builder.build({
      totalSyncRuns: scheduler?.getStatus().totalRuns ?? 0,
      dataAsOf:      scheduler?.getStatus().lastRun?.completedAt ?? null,
    });
  }

  // -------------------------------------------------------------------------
  // GET /reports/board  — JSON
  // -------------------------------------------------------------------------
  router.get("/board", async (_req: Request, res: Response) => {
    try {
      const report = await buildReport();
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /reports/board.csv
  // -------------------------------------------------------------------------
  router.get("/board.csv", async (_req: Request, res: Response) => {
    try {
      const report = await buildReport();
      const csv    = renderBoardReportCsv(report);
      const ts     = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="sentinel-board-report-${ts}.csv"`);
      res.send(csv);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /reports/board.pdf
  // -------------------------------------------------------------------------
  router.get("/board.pdf", async (_req: Request, res: Response) => {
    try {
      const report = await buildReport();
      const pdf    = await renderBoardReportPdf(report);
      const ts     = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="sentinel-board-report-${ts}.pdf"`);
      res.send(pdf);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  return router;
}
