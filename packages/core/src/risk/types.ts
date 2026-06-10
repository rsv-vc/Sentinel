/**
 * Risk engine types — Phase 5.
 *
 * Five risk dimensions per use-case.  Model-behaviour is UN_ASSESSED when
 * no evaluation data is present (never "passed").  Principle 1: nothing here
 * transfers or brokers risk — we surface gaps, we don't insure them.
 */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UN_ASSESSED";

export interface RiskDimension {
  /** Machine key */
  id: string;
  /** Human label */
  label: string;
  level: RiskLevel;
  /** Ordered list of evidence signals that drove this score */
  signals: string[];
  /** Remediation hints — always framed as "consider X", never a verdict */
  hints: string[];
}

export interface VendorConcentrationFlag {
  vendorLabel: string;
  vendorId: string;
  useCaseCount: number;
  /** Percentage of portfolio use-cases that depend on this vendor */
  portfolioShare: number;
}

export interface UseCaseRiskReport {
  useCaseId: string;
  useCaseLabel: string;
  /**
   * Residual = worst dimension level.
   * If any dimension is UN_ASSESSED the residual is also UN_ASSESSED.
   */
  residualLevel: RiskLevel;
  dimensions: {
    vendor: RiskDimension;
    contractual: RiskDimension;
    data: RiskDimension;
    modelBehaviour: RiskDimension;
    resilience: RiskDimension;
  };
  /** ISO timestamp when this report was generated */
  generatedAt: string;
}

export interface PortfolioRiskReport {
  totalUseCases: number;
  highOrCritical: number;
  unassessed: number;
  byLevel: Record<RiskLevel, number>;
  /** Vendors that appear in ≥40 % of use-cases */
  concentrationFlags: VendorConcentrationFlag[];
  generatedAt: string;
}
