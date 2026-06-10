/**
 * ComplianceEngine — Phase 5.
 *
 * Maps use-cases to applicable compliance obligations based on:
 *   - Jurisdiction of connected nodes (SUBJECT_TO edges)
 *   - Presence of model deployments
 *   - Presence of data assets (indicates personal data handling)
 *   - Cross-border transfers (multi-jurisdiction graph)
 *
 * Principle 5: output is ALWAYS "obligations and gaps" with an effective date.
 * This is never a legal determination, never a compliance certification.
 */

import type { GraphNode, IGraphRepository } from "@sentinel/db";
import type { ComplianceObligation, RuleSet } from "./rules";
import { ALL_RULE_SETS } from "./rules";

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export type GapStatus = "GAP" | "PARTIAL" | "EVIDENCED";

export interface ObligationResult {
  obligation: ComplianceObligation;
  ruleSet: { id: string; name: string; version: string; effectiveDate: string };
  /** Whether this obligation was triggered for this use-case */
  applies: boolean;
  /** Sentinel's assessment of current gap status based on available graph evidence */
  gapStatus: GapStatus;
  /** Signals that drove the gap assessment */
  signals: string[];
  /** Effective date of the rule-set at time of assessment */
  effectiveDate: string;
}

export interface UseCaseComplianceReport {
  useCaseId: string;
  useCaseLabel: string;
  /**
   * Active jurisdictions derived from graph evidence.
   */
  jurisdictions: string[];
  /**
   * Cross-border transfer detected when assets span more than one jurisdiction.
   */
  hasCrossBorderTransfer: boolean;
  hasModelDeployment: boolean;
  hasPersonalData: boolean;
  /**
   * Obligations that apply to this use-case, with gap analysis.
   * Does NOT include obligations that do not apply.
   */
  applicableObligations: ObligationResult[];
  totalApplicable: number;
  totalGaps: number;
  /**
   * Always-present disclaimer — Principle 5.
   */
  disclaimer: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

const DISCLAIMER =
  "This output describes regulatory obligations and identified gaps based on available graph evidence. " +
  "It is NOT a legal determination, compliance certification, or legal advice. " +
  "Consult qualified legal counsel before relying on this output for compliance decisions. " +
  "Rule-set versions and effective dates are stated; obligations may change.";

export class ComplianceEngine {
  constructor(private readonly graph: IGraphRepository) {}

  async assessUseCase(ucNode: GraphNode): Promise<UseCaseComplianceReport> {
    const subgraph = await this.graph.getNodeWithEdges(ucNode.id);

    const neighbourIds = subgraph
      ? [
          ...subgraph.edgesFrom.map((e) => e.toId),
          ...subgraph.edgesTo.map((e) => e.fromId),
        ]
      : [];

    const neighbours: GraphNode[] = (
      await Promise.all(neighbourIds.map((id) => this.graph.getNode(id)))
    ).filter(Boolean) as GraphNode[];

    // Derive context flags
    const jurisdictions = neighbours
      .filter((n) => n.type === "JURISDICTION")
      .map((n) => (n.attributes as Record<string, unknown>).code as string)
      .filter(Boolean);

    const uniqueJurisdictions = [...new Set(jurisdictions)];
    const hasCrossBorderTransfer = uniqueJurisdictions.length > 1;

    const hasModelDeployment = neighbours.some(
      (n) =>
        n.type === "ASSET" &&
        (n.attributes as Record<string, unknown>).kind === "MODEL_DEPLOYMENT",
    );

    const hasPersonalData = neighbours.some((n) => n.type === "DATA_ASSET");

    // High-risk AI system heuristic: model + EU jurisdiction + personal data
    const hasHighRiskAiSystem =
      hasModelDeployment && uniqueJurisdictions.includes("EU") && hasPersonalData;

    const context = {
      hasPersonalData,
      hasModelDeployment,
      hasCrossBorderTransfer,
      hasHighRiskAiSystem,
      jurisdictions: uniqueJurisdictions,
    };

    // Evaluate all rule-sets
    const applicableObligations: ObligationResult[] = [];

    for (const ruleSet of ALL_RULE_SETS) {
      for (const obligation of ruleSet.obligations) {
        if (!this.obligationApplies(obligation, context)) continue;

        const { status, signals } = this.deriveGapStatus(
          obligation,
          context,
          neighbours,
        );

        applicableObligations.push({
          obligation,
          ruleSet: {
            id: ruleSet.id,
            name: ruleSet.name,
            version: ruleSet.version,
            effectiveDate: ruleSet.effectiveDate,
          },
          applies: true,
          gapStatus: status,
          signals,
          effectiveDate: ruleSet.effectiveDate,
        });
      }
    }

    const totalGaps = applicableObligations.filter(
      (o) => o.gapStatus === "GAP",
    ).length;

    return {
      useCaseId: ucNode.id,
      useCaseLabel: ucNode.label,
      jurisdictions: uniqueJurisdictions,
      hasCrossBorderTransfer,
      hasModelDeployment,
      hasPersonalData,
      applicableObligations,
      totalApplicable: applicableObligations.length,
      totalGaps,
      disclaimer: DISCLAIMER,
      generatedAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private obligationApplies(
    obligation: ComplianceObligation,
    ctx: {
      jurisdictions: string[];
      hasPersonalData: boolean;
      hasModelDeployment: boolean;
      hasCrossBorderTransfer: boolean;
      hasHighRiskAiSystem: boolean;
    },
  ): boolean {
    // Jurisdiction check
    if (
      !obligation.jurisdictions.includes("ALL") &&
      !obligation.jurisdictions.some((j) => ctx.jurisdictions.includes(j))
    ) {
      return false;
    }

    // Context conditions
    const w = obligation.appliesWhen;
    if (w) {
      if (w.hasPersonalData && !ctx.hasPersonalData) return false;
      if (w.hasModelDeployment && !ctx.hasModelDeployment) return false;
      if (w.hasCrossBorderTransfer && !ctx.hasCrossBorderTransfer) return false;
      if (w.hasHighRiskAiSystem && !ctx.hasHighRiskAiSystem) return false;
    }

    return true;
  }

  private deriveGapStatus(
    obligation: ComplianceObligation,
    ctx: {
      hasPersonalData: boolean;
      hasModelDeployment: boolean;
      hasCrossBorderTransfer: boolean;
      hasHighRiskAiSystem: boolean;
      jurisdictions: string[];
    },
    neighbours: GraphNode[],
  ): { status: GapStatus; signals: string[] } {
    const signals: string[] = [];

    // Default: GAP — we have no evidence of compliance in the graph.
    // Only upgrade to PARTIAL or EVIDENCED when we have affirmative signals.
    let status: GapStatus = "GAP";

    // Cross-border transfer: if both EU and US detected, SCC/adequacy is assumed absent
    if (
      obligation.id === "gdpr-art46" &&
      ctx.hasCrossBorderTransfer &&
      ctx.jurisdictions.includes("EU")
    ) {
      signals.push(
        "Cross-border EU→US transfer detected; no transfer mechanism documented in graph",
      );
      status = "GAP";
    }

    // DPIA: if we have a model deployment but no DPIA attribute, it's a gap
    if (obligation.id === "gdpr-art35") {
      const dpiaEvidence = neighbours.some(
        (n) => (n.attributes as Record<string, unknown>).dpiaCompleted === true,
      );
      if (dpiaEvidence) {
        signals.push("DPIA completed flag found on connected asset");
        status = "EVIDENCED";
      } else {
        signals.push("No DPIA evidence recorded in graph for this use-case");
        status = "GAP";
      }
    }

    // EU AI Act: human oversight — if model deployment exists and no humanOversight attribute
    if (obligation.id === "euaia-art14" && ctx.hasHighRiskAiSystem) {
      const oversightEvidence = neighbours.some(
        (n) => (n.attributes as Record<string, unknown>).humanOversightEnabled === true,
      );
      if (oversightEvidence) {
        signals.push("Human oversight mechanism documented on connected asset");
        status = "EVIDENCED";
      } else {
        signals.push("No human oversight mechanism documented in graph");
        status = "GAP";
      }
    }

    // Generic: if no specific signals added yet
    if (signals.length === 0) {
      signals.push(
        "Obligation triggered by graph evidence; no specific compliance controls documented in graph",
      );
    }

    return { status, signals };
  }
}
