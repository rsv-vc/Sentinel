/**
 * CSV renderer for BoardReport — Phase 6.
 *
 * Produces a multi-section CSV with clearly labelled blocks so it can be
 * opened in Excel / Google Sheets by a CRO / CISO team without any tooling.
 *
 * Principle 3: coverage score + blind spots always included.
 * Principle 5: disclaimer row included before the compliance section.
 */

import type { BoardReport } from "@sentinel/core";

function esc(v: unknown): string {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cols: unknown[]): string {
  return cols.map(esc).join(",");
}

function section(title: string): string {
  return `\n${row(title)}\n`;
}

export function renderBoardReportCsv(report: BoardReport): string {
  const lines: string[] = [];
  const d = new Date(report.meta.generatedAt).toUTCString();
  const dataAsOf = report.meta.dataAsOf
    ? new Date(report.meta.dataAsOf).toUTCString()
    : "unknown";

  // ------------------------------------------------------------------
  // Header
  // ------------------------------------------------------------------
  lines.push(section("SENTINEL BOARD REPORT"));
  lines.push(row("Generated",      d));
  lines.push(row("Data as of",     dataAsOf));
  lines.push(row("Sync runs",      report.meta.totalSyncRuns));
  lines.push(row("Sentinel version", report.meta.sentinelVersion));

  // ------------------------------------------------------------------
  // 1 — Coverage
  // ------------------------------------------------------------------
  lines.push(section("SECTION 1 — COVERAGE"));
  lines.push(row("Disclaimer", report.coverage.disclaimer));
  lines.push(row("Coverage score (%)", report.coverage.score));
  lines.push(row("Total nodes",         report.coverage.totalNodes));
  lines.push(row("Telemetry nodes",     report.coverage.telemetryNodes));
  lines.push(row("Manual nodes",        report.coverage.manualNodes));
  lines.push(row("Unconfirmed (low-conf)", report.coverage.unconfirmedLowConfidence));

  if (report.coverage.blindSpots.length > 0) {
    lines.push("");
    lines.push(row("BLIND SPOTS", "", "", ""));
    lines.push(row("Kind", "Node ID", "Label", "Description"));
    for (const bs of report.coverage.blindSpots) {
      lines.push(row(bs.kind, bs.nodeId, bs.label, bs.description));
    }
  }

  // ------------------------------------------------------------------
  // 2 — Risk Summary
  // ------------------------------------------------------------------
  lines.push(section("SECTION 2 — RISK SUMMARY"));
  lines.push(row("Total use-cases",   report.risk.totalUseCases));
  lines.push(row("High or Critical",  report.risk.highOrCritical));
  lines.push(row("UN_ASSESSED",       report.risk.unassessed));
  lines.push("");
  lines.push(row("Level", "Count"));
  for (const [level, count] of Object.entries(report.risk.byLevel)) {
    lines.push(row(level, count));
  }

  if (report.risk.concentrationFlags.length > 0) {
    lines.push("");
    lines.push(row("VENDOR CONCENTRATION FLAGS", "", ""));
    lines.push(row("Vendor", "Use-case count", "Portfolio share (%)"));
    for (const f of report.risk.concentrationFlags) {
      lines.push(row(f.vendorLabel, f.useCaseCount, f.portfolioShare));
    }
  }

  lines.push("");
  lines.push(row("USE-CASE RISK TABLE", "", "", "", "", ""));
  lines.push(row("Use-case", "Residual level", "Jurisdictions", "Compliance gaps", "Top signals"));
  for (const uc of report.risk.useCaseSummaries) {
    lines.push(row(
      uc.label,
      uc.residualLevel,
      uc.jurisdictions.join("; "),
      uc.complianceGapCount,
      uc.topSignals.slice(0, 3).join(" | "),
    ));
  }

  // ------------------------------------------------------------------
  // 3 — Compliance
  // ------------------------------------------------------------------
  lines.push(section("SECTION 3 — COMPLIANCE OBLIGATIONS & GAPS"));
  lines.push(row("Disclaimer", report.compliance.disclaimer));
  lines.push(row("Total obligations triggered", report.compliance.totalObligationsTriggered));
  lines.push(row("Total gaps",                  report.compliance.totalGaps));

  if (report.compliance.topGaps.length > 0) {
    lines.push("");
    lines.push(row("Obligation", "Reference", "Rule-set", "Version", "Effective date", "Affected use-cases", "Use-case labels"));
    for (const gap of report.compliance.topGaps) {
      lines.push(row(
        gap.obligationTitle,
        gap.reference,
        gap.ruleSetName,
        gap.ruleSetVersion,
        gap.effectiveDate,
        gap.affectedUseCaseCount,
        gap.affectedUseCaseLabels.join("; "),
      ));
    }
  }

  return lines.join("\n");
}
