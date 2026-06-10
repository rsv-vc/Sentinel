/**
 * Board report types — Phase 6.
 *
 * Principle 3: coverage score + blind spots are ALWAYS included.
 * Principle 5: compliance output always carries effective date and disclaimer.
 */

import type { BlindSpot } from "../coverage";
import type { RiskLevel } from "../risk/types";

export interface BoardReportMeta {
  /** ISO timestamp the report was generated */
  generatedAt: string;
  /** ISO timestamp of the most recent sync that contributed data */
  dataAsOf: string | null;
  /** Total number of sync runs observed */
  totalSyncRuns: number;
  /** Sentinel version identifier */
  sentinelVersion: string;
}

export interface BoardReportCoverage {
  /** 0–100 */
  score: number;
  telemetryNodes: number;
  manualNodes: number;
  totalNodes: number;
  unconfirmedLowConfidence: number;
  blindSpots: BlindSpot[];
  /** Principle 3 disclaimer — always included */
  disclaimer: string;
}

export interface UseCaseRiskSummary {
  id: string;
  label: string;
  residualLevel: RiskLevel;
  topSignals: string[];
  /** IDs of applicable compliance obligations that are gaps */
  complianceGapCount: number;
  jurisdictions: string[];
}

export interface BoardReportRisk {
  totalUseCases: number;
  byLevel: Record<RiskLevel, number>;
  highOrCritical: number;
  unassessed: number;
  concentrationFlags: Array<{
    vendorLabel: string;
    useCaseCount: number;
    portfolioShare: number;
  }>;
  useCaseSummaries: UseCaseRiskSummary[];
}

export interface ComplianceGapSummary {
  obligationId: string;
  obligationTitle: string;
  reference: string;
  ruleSetName: string;
  ruleSetVersion: string;
  effectiveDate: string;
  affectedUseCaseCount: number;
  affectedUseCaseLabels: string[];
}

export interface BoardReportCompliance {
  totalObligationsTriggered: number;
  totalGaps: number;
  topGaps: ComplianceGapSummary[];
  /** Principle 5 disclaimer — always included */
  disclaimer: string;
}

export interface BoardReport {
  meta: BoardReportMeta;
  coverage: BoardReportCoverage;
  risk: BoardReportRisk;
  compliance: BoardReportCompliance;
}
