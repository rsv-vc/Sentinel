export { NormalizationService } from "./normalization.service";
export type { NormalizationResult } from "./normalization.service";
export { deterministicId, nodeId } from "./deterministic-id";
export { CoverageCalculator } from "./coverage";
export type { BlindSpot, BlindSpotKind, CoverageReport } from "./coverage";
export { RiskEngine } from "./risk";
export type {
  RiskDimension,
  RiskLevel,
  UseCaseRiskReport,
  PortfolioRiskReport,
  VendorConcentrationFlag,
} from "./risk";
export { ComplianceEngine } from "./compliance";
export type {
  UseCaseComplianceReport,
  ObligationResult,
  GapStatus,
  RuleSet,
  ComplianceObligation,
} from "./compliance";
export { BoardReportBuilder } from "./reports";
export type {
  BoardReport,
  BoardReportMeta,
  BoardReportCoverage,
  BoardReportRisk,
  BoardReportCompliance,
  UseCaseRiskSummary,
  ComplianceGapSummary,
} from "./reports";
