/**
 * BoardReportBuilder — Phase 6.
 *
 * Assembles a BoardReport by running:
 *   1. CoverageCalculator   → coverage section (Principle 3: always included)
 *   2. RiskEngine           → risk section per use-case + portfolio
 *   3. ComplianceEngine     → compliance obligations & gaps per use-case
 *
 * This builder is pure data assembly — rendering (PDF/CSV) is handled in the
 * API layer so the core package has no I/O dependencies.
 */

import type { IGraphRepository } from "@sentinel/db";
import { CoverageCalculator } from "../coverage";
import { RiskEngine } from "../risk/RiskEngine";
import { ComplianceEngine } from "../compliance/ComplianceEngine";
import type {
  BoardReport,
  BoardReportMeta,
  BoardReportCoverage,
  BoardReportRisk,
  BoardReportCompliance,
  UseCaseRiskSummary,
  ComplianceGapSummary,
} from "./types";
import type { RiskLevel } from "../risk/types";

const SENTINEL_VERSION = "0.6.0";

const COVERAGE_DISCLAIMER =
  "Coverage score reflects the ratio of nodes observed via live telemetry versus manually attested. " +
  "Blind spots are enumerated but may be incomplete — Sentinel does not claim full visibility of the AI estate.";

const COMPLIANCE_DISCLAIMER =
  "Compliance obligations and gaps are derived from available graph evidence. " +
  "This is NOT a legal determination, compliance certification, or legal advice. " +
  "Rule-set versions and effective dates are stated; obligations may change. " +
  "Consult qualified legal counsel before relying on this output.";

export class BoardReportBuilder {
  private readonly coverage: CoverageCalculator;
  private readonly risk: RiskEngine;
  private readonly compliance: ComplianceEngine;

  constructor(private readonly graph: IGraphRepository) {
    this.coverage   = new CoverageCalculator();
    this.risk       = new RiskEngine(graph);
    this.compliance = new ComplianceEngine(graph);
  }

  async build(opts: { totalSyncRuns?: number; dataAsOf?: string | null } = {}): Promise<BoardReport> {
    const [allNodes, recentEvents] = await Promise.all([
      this.graph.listNodes(),
      this.graph.listRecentEvents(1),
    ]);

    const useCaseNodes = allNodes.filter((n) => n.type === "USE_CASE");

    // ------------------------------------------------------------------
    // Meta
    // ------------------------------------------------------------------
    const dataAsOf =
      opts.dataAsOf ??
      (recentEvents[0]?.createdAt?.toISOString?.() ?? recentEvents[0]?.createdAt?.toString?.() ?? null);

    const meta: BoardReportMeta = {
      generatedAt:    new Date().toISOString(),
      dataAsOf,
      totalSyncRuns:  opts.totalSyncRuns ?? 0,
      sentinelVersion: SENTINEL_VERSION,
    };

    // ------------------------------------------------------------------
    // Coverage (Principle 3 — always included)
    // ------------------------------------------------------------------
    const connectedIds = new Set<string>();
    for (const node of allNodes) {
      const sub = await this.graph.getNodeWithEdges(node.id);
      if (sub && (sub.edgesFrom.length > 0 || sub.edgesTo.length > 0)) {
        connectedIds.add(node.id);
      }
    }

    const coverageReport = this.coverage.compute(allNodes, connectedIds);

    const coverageSection: BoardReportCoverage = {
      score:                    coverageReport.coverageScore,
      telemetryNodes:           coverageReport.telemetryNodes,
      manualNodes:              coverageReport.manualNodes,
      totalNodes:               coverageReport.totalNodes,
      unconfirmedLowConfidence: coverageReport.unconfirmedLowConfidence,
      blindSpots:               coverageReport.blindSpots,
      disclaimer:               COVERAGE_DISCLAIMER,
    };

    // ------------------------------------------------------------------
    // Risk — score every use-case
    // ------------------------------------------------------------------
    const useCaseRiskReports = await Promise.all(
      useCaseNodes.map((uc) => this.risk.scoreUseCase(uc)),
    );

    const byLevel: Record<RiskLevel, number> = {
      LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, UN_ASSESSED: 0,
    };
    for (const r of useCaseRiskReports) byLevel[r.residualLevel]++;

    // Compliance gaps per use-case (needed for useCaseSummaries)
    const useCaseCompReports = await Promise.all(
      useCaseNodes.map((uc) => this.compliance.assessUseCase(uc)),
    );

    const useCaseSummaries: UseCaseRiskSummary[] = useCaseRiskReports.map((rr, i) => {
      const compReport = useCaseCompReports[i];
      // Collect the two most significant signals across dimensions
      const allSignals = Object.values(rr.dimensions).flatMap((d) => d.signals);
      const topSignals = allSignals.slice(0, 3);
      return {
        id:                 rr.useCaseId,
        label:              rr.useCaseLabel,
        residualLevel:      rr.residualLevel,
        topSignals,
        complianceGapCount: compReport.totalGaps,
        jurisdictions:      compReport.jurisdictions,
      };
    });

    const portfolioReport = await this.risk.portfolioReport();

    const riskSection: BoardReportRisk = {
      totalUseCases:    useCaseNodes.length,
      byLevel,
      highOrCritical:   portfolioReport.highOrCritical,
      unassessed:       portfolioReport.unassessed,
      concentrationFlags: portfolioReport.concentrationFlags.map((f) => ({
        vendorLabel:    f.vendorLabel,
        useCaseCount:   f.useCaseCount,
        portfolioShare: f.portfolioShare,
      })),
      useCaseSummaries: useCaseSummaries.sort((a, b) => {
        // Sort: CRITICAL > HIGH > UN_ASSESSED > MEDIUM > LOW
        const ORDER: Record<RiskLevel, number> = { CRITICAL: 0, HIGH: 1, UN_ASSESSED: 2, MEDIUM: 3, LOW: 4 };
        return ORDER[a.residualLevel] - ORDER[b.residualLevel];
      }),
    };

    // ------------------------------------------------------------------
    // Compliance — aggregate gaps across all use-cases
    // ------------------------------------------------------------------
    const gapMap = new Map<string, ComplianceGapSummary>();

    for (const compReport of useCaseCompReports) {
      for (const ob of compReport.applicableObligations) {
        if (ob.gapStatus !== "GAP") continue;
        const existing = gapMap.get(ob.obligation.id);
        const ucLabel  = compReport.useCaseLabel;
        if (existing) {
          existing.affectedUseCaseCount++;
          existing.affectedUseCaseLabels.push(ucLabel);
        } else {
          gapMap.set(ob.obligation.id, {
            obligationId:           ob.obligation.id,
            obligationTitle:        ob.obligation.title,
            reference:              ob.obligation.reference,
            ruleSetName:            ob.ruleSet.name,
            ruleSetVersion:         ob.ruleSet.version,
            effectiveDate:          ob.effectiveDate,
            affectedUseCaseCount:   1,
            affectedUseCaseLabels:  [ucLabel],
          });
        }
      }
    }

    const topGaps = Array.from(gapMap.values())
      .sort((a, b) => b.affectedUseCaseCount - a.affectedUseCaseCount)
      .slice(0, 10);

    const totalObligationsTriggered = useCaseCompReports.reduce(
      (sum, r) => sum + r.totalApplicable, 0,
    );
    const totalGaps = useCaseCompReports.reduce((sum, r) => sum + r.totalGaps, 0);

    const complianceSection: BoardReportCompliance = {
      totalObligationsTriggered,
      totalGaps,
      topGaps,
      disclaimer: COMPLIANCE_DISCLAIMER,
    };

    return { meta, coverage: coverageSection, risk: riskSection, compliance: complianceSection };
  }
}
