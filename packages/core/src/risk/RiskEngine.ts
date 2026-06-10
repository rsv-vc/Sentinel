/**
 * RiskEngine — Phase 5.
 *
 * Scores each UseCase across five dimensions:
 *   vendor         — single-vendor dependency, concentration, unknown vendor
 *   contractual    — identity grants that are overly-broad or manual
 *   data           — cross-border egress, unclassified data, storage without use-case
 *   modelBehaviour — UN_ASSESSED unless explicit eval evidence is present
 *   resilience     — single-region, no redundancy signal
 *
 * Principle 1: this engine NEVER recommends insurance, risk transfer, or any
 *   brokering of compute / tooling.  All hints are operational remediations.
 * Principle 5: output is always framed as "signals and gaps", never a legal
 *   determination or a compliance verdict.
 */

import type { GraphNode, GraphEdge, IGraphRepository } from "@sentinel/db";
import type {
  RiskDimension,
  RiskLevel,
  UseCaseRiskReport,
  PortfolioRiskReport,
  VendorConcentrationFlag,
} from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEVEL_ORDER: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "UN_ASSESSED"];

function worstLevel(levels: RiskLevel[]): RiskLevel {
  if (levels.includes("UN_ASSESSED")) return "UN_ASSESSED";
  let worst: RiskLevel = "LOW";
  for (const l of levels) {
    if (LEVEL_ORDER.indexOf(l) > LEVEL_ORDER.indexOf(worst)) worst = l;
  }
  return worst;
}

function dim(
  id: string,
  label: string,
  level: RiskLevel,
  signals: string[],
  hints: string[],
): RiskDimension {
  return { id, label, level, signals, hints };
}

// ---------------------------------------------------------------------------
// RiskEngine
// ---------------------------------------------------------------------------

export class RiskEngine {
  constructor(private readonly graph: IGraphRepository) {}

  // -------------------------------------------------------------------------
  // Portfolio report — concentration flags across all use-cases
  // -------------------------------------------------------------------------
  async portfolioReport(): Promise<PortfolioRiskReport> {
    const useCases = await this.graph.listNodes("USE_CASE");
    const vendorUseCaseCount = new Map<string, { label: string; count: number }>();

    for (const uc of useCases) {
      const subgraph = await this.graph.getNodeWithEdges(uc.id);
      if (!subgraph) continue;

      const neighbourIds = [
        ...subgraph.edgesFrom.map((e) => e.toId),
        ...subgraph.edgesTo.map((e) => e.fromId),
      ];

      for (const nid of neighbourIds) {
        const neighbour = await this.graph.getNode(nid);
        if (neighbour?.type === "VENDOR") {
          const existing = vendorUseCaseCount.get(nid);
          vendorUseCaseCount.set(nid, {
            label: neighbour.label,
            count: (existing?.count ?? 0) + 1,
          });
        }
      }
    }

    const total = useCases.length;
    const concentrationFlags: VendorConcentrationFlag[] = [];

    for (const [vendorId, { label, count }] of vendorUseCaseCount) {
      const share = total > 0 ? Math.round((count / total) * 100) : 0;
      if (share >= 40) {
        concentrationFlags.push({ vendorId, vendorLabel: label, useCaseCount: count, portfolioShare: share });
      }
    }

    // Quick pass for level distribution
    const byLevel: Record<RiskLevel, number> = {
      LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, UN_ASSESSED: 0,
    };
    let highOrCritical = 0;
    let unassessed = 0;
    for (const uc of useCases) {
      const report = await this.scoreUseCase(uc);
      byLevel[report.residualLevel]++;
      if (report.residualLevel === "HIGH" || report.residualLevel === "CRITICAL") highOrCritical++;
      if (report.residualLevel === "UN_ASSESSED") unassessed++;
    }

    return {
      totalUseCases: total,
      highOrCritical,
      unassessed,
      byLevel,
      concentrationFlags,
      generatedAt: new Date().toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // Use-case risk report
  // -------------------------------------------------------------------------
  async scoreUseCase(ucNode: GraphNode): Promise<UseCaseRiskReport> {
    const subgraph = await this.graph.getNodeWithEdges(ucNode.id);

    // All neighbour IDs from edges (both directions from this use-case)
    const neighbourIds = subgraph
      ? [
          ...subgraph.edgesFrom.map((e) => e.toId),
          ...subgraph.edgesTo.map((e) => e.fromId),
        ]
      : [];

    const neighbours: GraphNode[] = (
      await Promise.all(neighbourIds.map((id) => this.graph.getNode(id)))
    ).filter(Boolean) as GraphNode[];

    const edges: GraphEdge[] = subgraph
      ? [...subgraph.edgesFrom, ...subgraph.edgesTo]
      : [];

    const vendorDim     = await this.scoreVendor(neighbours, edges);
    const contractDim   = await this.scoreContractual(ucNode.id, neighbours);
    const dataDim       = await this.scoreData(neighbours, edges);
    const modelBehDim   = this.scoreModelBehaviour(neighbours);
    const resilienceDim = this.scoreResilience(neighbours);

    const residualLevel = worstLevel([
      vendorDim.level,
      contractDim.level,
      dataDim.level,
      modelBehDim.level,
      resilienceDim.level,
    ]);

    return {
      useCaseId: ucNode.id,
      useCaseLabel: ucNode.label,
      residualLevel,
      dimensions: {
        vendor: vendorDim,
        contractual: contractDim,
        data: dataDim,
        modelBehaviour: modelBehDim,
        resilience: resilienceDim,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // Dimension: vendor
  // -------------------------------------------------------------------------
  private async scoreVendor(
    neighbours: GraphNode[],
    _edges: GraphEdge[],
  ): Promise<RiskDimension> {
    const vendors = neighbours.filter((n) => n.type === "VENDOR");
    const signals: string[] = [];
    let level: RiskLevel = "LOW";

    if (vendors.length === 0) {
      signals.push("No vendor nodes detected in subgraph");
      level = "MEDIUM";
    } else if (vendors.length === 1) {
      signals.push(`Single-vendor dependency: ${vendors[0].label}`);
      level = "HIGH";
    } else {
      signals.push(`${vendors.length} vendors detected: ${vendors.map((v) => v.label).join(", ")}`);
      level = "MEDIUM";
    }

    // Unknown / LOW-confidence vendors raise level
    const unknownVendors = vendors.filter((v) => v.confidence === "LOW");
    if (unknownVendors.length > 0) {
      signals.push(`${unknownVendors.length} vendor(s) with low-confidence metadata`);
      level = worstLevel([level, "HIGH"]);
    }

    return dim("vendor", "Vendor / Concentration", level, signals, [
      "Consider multi-vendor architecture for critical capabilities",
      "Ensure vendor contracts include SLA obligations and data portability clauses",
    ]);
  }

  // -------------------------------------------------------------------------
  // Dimension: contractual (identity grants)
  // -------------------------------------------------------------------------
  private async scoreContractual(
    _ucId: string,
    neighbours: GraphNode[],
  ): Promise<RiskDimension> {
    // Surface over-broad grants from connected asset attributes
    const signals: string[] = [];
    let level: RiskLevel = "LOW";

    const assets = neighbours.filter((n) => n.type === "ASSET");
    let manualGrants = 0;
    let overBroadGrants = 0;

    for (const asset of assets) {
      const attrs = asset.attributes as Record<string, unknown>;
      if (attrs.grantLevel === "ADMIN" || attrs.grantLevel === "OWNER") {
        overBroadGrants++;
      }
      if (attrs.grantSource === "manual") {
        manualGrants++;
      }
    }

    if (overBroadGrants > 0) {
      signals.push(`${overBroadGrants} asset(s) with ADMIN/OWNER grant level detected`);
      level = "HIGH";
    }
    if (manualGrants > 0) {
      signals.push(`${manualGrants} manually-attested grant(s) — not from live telemetry`);
      level = worstLevel([level, "MEDIUM"]);
    }
    if (signals.length === 0) {
      signals.push("No over-broad identity grants detected in connected assets");
    }

    return dim("contractual", "Contractual / Identity", level, signals, [
      "Apply least-privilege to all service accounts and contractor principals",
      "Review manual grants — migrate to telemetry-sourced attestation",
      "Set grant expiry dates; review quarterly",
    ]);
  }

  // -------------------------------------------------------------------------
  // Dimension: data
  // -------------------------------------------------------------------------
  private async scoreData(
    neighbours: GraphNode[],
    edges: GraphEdge[],
  ): Promise<RiskDimension> {
    const signals: string[] = [];
    let level: RiskLevel = "LOW";

    const jurisdictions = neighbours.filter((n) => n.type === "JURISDICTION");
    const dataAssets = neighbours.filter((n) => n.type === "DATA_ASSET");

    // Multiple jurisdictions = cross-border data flow risk
    if (jurisdictions.length > 1) {
      const codes = (jurisdictions.map((j) => (j.attributes as Record<string, unknown>).code as string)).join(", ");
      signals.push(`Data flows span multiple jurisdictions: ${codes}`);
      level = "HIGH";
    }

    // Check for EU jurisdiction (GDPR / EU AI Act)
    const hasEU = jurisdictions.some(
      (j) => (j.attributes as Record<string, unknown>).code === "EU",
    );
    const hasUS = jurisdictions.some(
      (j) => (j.attributes as Record<string, unknown>).code === "US",
    );
    if (hasEU && hasUS) {
      signals.push("EU→US cross-border transfer detected — Schrems II / SCC obligations apply");
      level = worstLevel([level, "HIGH"]);
    }

    // Unclassified data assets
    const unclassified = dataAssets.filter((d) => {
      const attrs = d.attributes as Record<string, unknown>;
      return !attrs.classification || attrs.classification === "unclassified";
    });
    if (unclassified.length > 0) {
      signals.push(`${unclassified.length} data asset(s) with no classification label`);
      level = worstLevel([level, "MEDIUM"]);
    }

    if (signals.length === 0) {
      signals.push("No cross-border data transfer or classification gaps detected");
    }

    return dim("data", "Data / Residency", level, signals, [
      "Classify all data assets before processing in AI systems",
      "Document cross-border transfer mechanisms (SCC, adequacy decision, etc.)",
      "Restrict data residency where regulations mandate (e.g. DPDP, GDPR Art. 46)",
    ]);
  }

  // -------------------------------------------------------------------------
  // Dimension: model behaviour — UN_ASSESSED by default (Principle 3)
  // -------------------------------------------------------------------------
  private scoreModelBehaviour(neighbours: GraphNode[]): RiskDimension {
    const models = neighbours.filter(
      (n) =>
        n.type === "ASSET" &&
        (n.attributes as Record<string, unknown>).kind === "MODEL_DEPLOYMENT",
    );

    const signals: string[] = [];
    let level: RiskLevel = "UN_ASSESSED";

    if (models.length === 0) {
      signals.push("No model deployments connected to this use-case");
      level = "UN_ASSESSED";
    } else {
      for (const m of models) {
        const attrs = m.attributes as Record<string, unknown>;
        const evalStatus = attrs.evalStatus as string | undefined;
        if (!evalStatus) {
          signals.push(`Model "${m.label}" has no evaluation/red-team evidence on record`);
        } else if (evalStatus === "passed") {
          signals.push(`Model "${m.label}" evaluation recorded`);
          level = worstLevel([level === "UN_ASSESSED" ? "LOW" : level, "LOW"]);
        } else {
          signals.push(`Model "${m.label}" evaluation status: ${evalStatus}`);
        }
      }
    }

    return dim(
      "modelBehaviour",
      "Model Behaviour",
      level,
      signals,
      [
        "Commission adversarial red-teaming and record results against this use-case",
        "Establish ongoing model drift monitoring (accuracy, bias, toxicity)",
        "Do not treat absence of failures as a passing result — this dimension is UN_ASSESSED until evidence is filed",
      ],
    );
  }

  // -------------------------------------------------------------------------
  // Dimension: resilience
  // -------------------------------------------------------------------------
  private scoreResilience(neighbours: GraphNode[]): RiskDimension {
    const signals: string[] = [];
    let level: RiskLevel = "LOW";

    const assets = neighbours.filter(
      (n) =>
        n.type === "ASSET" &&
        (n.attributes as Record<string, unknown>).kind !== "MODEL_DEPLOYMENT",
    );
    const regions = new Set(
      assets
        .map((a) => (a.attributes as Record<string, unknown>).region as string)
        .filter(Boolean),
    );

    if (assets.length === 0) {
      signals.push("No compute/storage assets linked — resilience cannot be assessed");
      level = "MEDIUM";
    } else if (regions.size === 1) {
      signals.push(`All assets in a single region: ${[...regions][0]}`);
      level = "MEDIUM";
    } else {
      signals.push(`Assets spread across ${regions.size} regions: ${[...regions].join(", ")}`);
      level = "LOW";
    }

    // Low-confidence (shadow) assets increase resilience uncertainty
    const lowConf = assets.filter((a) => a.confidence === "LOW");
    if (lowConf.length > 0) {
      signals.push(`${lowConf.length} low-confidence asset(s) — inventory completeness uncertain`);
      level = worstLevel([level, "MEDIUM"]);
    }

    return dim("resilience", "Resilience / Availability", level, signals, [
      "Define and test a recovery-time objective (RTO) and recovery-point objective (RPO)",
      "Consider multi-region failover for mission-critical inference workloads",
      "Confirm all shadow assets — untracked assets cannot be included in DR plans",
    ]);
  }
}
