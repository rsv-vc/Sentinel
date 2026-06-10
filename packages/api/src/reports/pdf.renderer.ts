/**
 * PDF renderer for BoardReport — Phase 6.
 *
 * Uses pdfkit for pure-JS PDF generation (no Puppeteer / headless browser).
 * Returns a Buffer so the route can stream it directly.
 *
 * Principle 3: coverage score and blind spots are always in the document.
 * Principle 5: compliance disclaimer always printed before the compliance section.
 */

import PDFDocument from "pdfkit";
import type { BoardReport } from "@sentinel/core";

// Palette (dark SaaS tokens → PDF safe colours)
const C = {
  ink:       "#1a1a2e",
  muted:     "#5b5b70",
  accent:    "#6366f1",
  green:     "#22c55e",
  amber:     "#f59e0b",
  red:       "#ef4444",
  white:     "#ffffff",
  lightgrey: "#e4e4f0",
  divider:   "#2a2a38",
} as const;

const RISK_COLOR: Record<string, string> = {
  LOW:         C.green,
  MEDIUM:      C.amber,
  HIGH:        C.red,
  CRITICAL:    C.red,
  UN_ASSESSED: C.muted,
};

export function renderBoardReportPdf(report: BoardReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ size: "A4", margin: 50, info: { Title: "Sentinel Board Report", Author: "Sentinel" } });
    const chunks: Buffer[] = [];

    doc.on("data",  (chunk: Buffer) => chunks.push(chunk));
    doc.on("end",   ()              => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W    = doc.page.width  - 100; // usable width
    const LEFT = 50;

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    function heading1(text: string) {
      doc.moveDown(0.5);
      doc.fontSize(18).fillColor(C.ink).font("Helvetica-Bold").text(text, LEFT, undefined, { width: W });
      doc.moveDown(0.3);
    }

    function heading2(text: string) {
      doc.moveDown(0.6);
      doc.fontSize(13).fillColor(C.accent).font("Helvetica-Bold").text(text, LEFT, undefined, { width: W });
      doc.moveDown(0.2);
      doc.moveTo(LEFT, doc.y).lineTo(LEFT + W, doc.y).strokeColor(C.divider).lineWidth(0.5).stroke();
      doc.moveDown(0.3);
    }

    function body(text: string, color = C.ink) {
      doc.fontSize(9).fillColor(color).font("Helvetica").text(text, LEFT, undefined, { width: W });
    }

    function kv(key: string, value: string, valueColor = C.ink) {
      doc.fontSize(9).fillColor(C.muted).font("Helvetica").text(key + "  ", LEFT, undefined, { continued: true });
      doc.fillColor(valueColor).font("Helvetica-Bold").text(value);
    }

    function disclaimer(text: string) {
      doc.moveDown(0.5);
      doc.fontSize(7.5).fillColor(C.muted).font("Helvetica-Oblique")
        .text("⚠  " + text, LEFT, undefined, { width: W });
      doc.moveDown(0.3);
    }

    function bullet(text: string, indent = 10) {
      doc.fontSize(9).fillColor(C.ink).font("Helvetica")
        .text("·  " + text, LEFT + indent, undefined, { width: W - indent });
    }

    function pill(text: string, color: string) {
      const oldY = doc.y;
      doc.fontSize(8).fillColor(color).font("Helvetica-Bold").text(`[${text}]`, { continued: true });
      doc.fillColor(C.ink).font("Helvetica").text("  ");
    }

    // ------------------------------------------------------------------
    // Cover / Header
    // ------------------------------------------------------------------
    doc.fontSize(28).fillColor(C.ink).font("Helvetica-Bold")
       .text("Sentinel", LEFT, 60);
    doc.fontSize(13).fillColor(C.muted).font("Helvetica")
       .text("AI Risk Board Report", LEFT);
    doc.moveDown(0.5);
    kv("Generated:", new Date(report.meta.generatedAt).toUTCString());
    if (report.meta.dataAsOf) {
      kv("Data as of:", new Date(report.meta.dataAsOf).toUTCString());
    }
    kv("Sync runs:",  String(report.meta.totalSyncRuns));
    kv("Sentinel v:", report.meta.sentinelVersion);

    // ------------------------------------------------------------------
    // 1 — Coverage (Principle 3)
    // ------------------------------------------------------------------
    heading2("1 · Coverage");

    const scoreColor = report.coverage.score >= 80 ? C.green
                     : report.coverage.score >= 50 ? C.amber
                     : C.red;

    doc.fontSize(36).fillColor(scoreColor).font("Helvetica-Bold")
       .text(`${report.coverage.score}%`, LEFT, undefined, { continued: true });
    doc.fontSize(11).fillColor(C.muted).font("Helvetica").text("  coverage score");

    doc.moveDown(0.4);
    kv("Total nodes:",                 String(report.coverage.totalNodes));
    kv("Telemetry-observed:",          String(report.coverage.telemetryNodes));
    kv("Manually attested:",           String(report.coverage.manualNodes));
    kv("Unconfirmed (low confidence):", String(report.coverage.unconfirmedLowConfidence));

    if (report.coverage.blindSpots.length > 0) {
      doc.moveDown(0.4);
      doc.fontSize(10).fillColor(C.red).font("Helvetica-Bold").text(`Blind spots (${report.coverage.blindSpots.length}):`);
      for (const bs of report.coverage.blindSpots.slice(0, 20)) {
        bullet(`[${bs.kind}] ${bs.label} — ${bs.description}`);
      }
      if (report.coverage.blindSpots.length > 20) {
        body(`… and ${report.coverage.blindSpots.length - 20} more.`, C.muted);
      }
    } else {
      doc.moveDown(0.3);
      body("No blind spots detected in current graph.", C.green);
    }

    disclaimer(report.coverage.disclaimer);

    // ------------------------------------------------------------------
    // 2 — Risk Summary
    // ------------------------------------------------------------------
    heading2("2 · Risk Summary");

    kv("Use-cases assessed:", String(report.risk.totalUseCases));
    kv("High or Critical:",   String(report.risk.highOrCritical),  report.risk.highOrCritical   > 0 ? C.red  : C.green);
    kv("UN_ASSESSED:",        String(report.risk.unassessed),       report.risk.unassessed       > 0 ? C.amber : C.green);

    // Level breakdown
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor(C.muted).font("Helvetica").text("Distribution:", LEFT);
    for (const [level, count] of Object.entries(report.risk.byLevel)) {
      if (count > 0) {
        kv(`  ${level}:`, String(count), RISK_COLOR[level] ?? C.ink);
      }
    }

    // Concentration flags
    if (report.risk.concentrationFlags.length > 0) {
      doc.moveDown(0.4);
      doc.fontSize(10).fillColor(C.amber).font("Helvetica-Bold").text("Vendor concentration flags:");
      for (const f of report.risk.concentrationFlags) {
        bullet(`${f.vendorLabel} — ${f.portfolioShare}% of use-cases (${f.useCaseCount})`);
      }
    }

    // Per-use-case table
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor(C.ink).font("Helvetica-Bold").text("Use-case risk table:");
    doc.moveDown(0.2);

    for (const uc of report.risk.useCaseSummaries) {
      const levelColor = RISK_COLOR[uc.residualLevel] ?? C.ink;
      doc.fontSize(9).fillColor(C.ink).font("Helvetica-Bold")
         .text(uc.label, LEFT + 4, undefined, { continued: true });
      doc.fillColor(levelColor).font("Helvetica-Bold")
         .text(`  ${uc.residualLevel}`);
      if (uc.jurisdictions.length > 0) {
        doc.fontSize(8).fillColor(C.muted).font("Helvetica")
           .text(`  Jurisdictions: ${uc.jurisdictions.join(", ")}`, LEFT + 10);
      }
      if (uc.complianceGapCount > 0) {
        doc.fontSize(8).fillColor(C.red).font("Helvetica")
           .text(`  ${uc.complianceGapCount} compliance gap(s)`, LEFT + 10);
      }
      for (const sig of uc.topSignals.slice(0, 2)) {
        doc.fontSize(8).fillColor(C.muted).font("Helvetica")
           .text(`  · ${sig}`, LEFT + 10, undefined, { width: W - 10 });
      }
      doc.moveDown(0.3);
    }

    // ------------------------------------------------------------------
    // 3 — Compliance Gaps (Principle 5 — disclaimer first)
    // ------------------------------------------------------------------
    heading2("3 · Compliance Obligations & Gaps");

    disclaimer(report.compliance.disclaimer);

    kv("Total obligations triggered:", String(report.compliance.totalObligationsTriggered));
    kv("Total gaps:",                  String(report.compliance.totalGaps),
       report.compliance.totalGaps > 0 ? C.red : C.green);

    if (report.compliance.topGaps.length > 0) {
      doc.moveDown(0.4);
      doc.fontSize(10).fillColor(C.ink).font("Helvetica-Bold")
         .text(`Top ${report.compliance.topGaps.length} gaps (by affected use-cases):`);
      doc.moveDown(0.2);

      for (const gap of report.compliance.topGaps) {
        doc.fontSize(9).fillColor(C.red).font("Helvetica-Bold")
           .text(gap.obligationTitle, LEFT + 4, undefined, { continued: true });
        doc.fillColor(C.muted).font("Helvetica")
           .text(`  [${gap.reference}]`);
        doc.fontSize(8).fillColor(C.muted).font("Helvetica")
           .text(
             `  ${gap.ruleSetName} v${gap.ruleSetVersion} · eff. ${gap.effectiveDate} · ` +
             `${gap.affectedUseCaseCount} use-case(s): ${gap.affectedUseCaseLabels.slice(0, 3).join(", ")}` +
             (gap.affectedUseCaseLabels.length > 3 ? " …" : ""),
             LEFT + 10, undefined, { width: W - 10 },
           );
        doc.moveDown(0.4);
      }
    } else {
      doc.moveDown(0.3);
      body("No compliance gaps identified based on current graph evidence.", C.green);
    }

    // ------------------------------------------------------------------
    // Footer
    // ------------------------------------------------------------------
    doc.moveDown(1);
    doc.moveTo(LEFT, doc.y).lineTo(LEFT + W, doc.y).strokeColor(C.divider).lineWidth(0.5).stroke();
    doc.moveDown(0.3);
    doc.fontSize(7).fillColor(C.muted).font("Helvetica")
       .text(
         `Sentinel v${report.meta.sentinelVersion} · Local prototype · ` +
         `Generated ${new Date(report.meta.generatedAt).toUTCString()} · ` +
         "This report is for internal risk-management purposes only. Not a legal determination.",
         LEFT, undefined, { width: W, align: "center" },
       );

    doc.end();
  });
}
