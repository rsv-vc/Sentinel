/**
 * CoverageCalculator — Principle 3 (Evidenced, not complete).
 *
 * Computes a coverage score and enumerates known blind spots.
 * The score is the share of nodes observed via live telemetry vs. total
 * registered nodes (telemetry + manual).
 *
 * IMPORTANT: This calculator NEVER claims the estate is fully discovered.
 * It always returns a `blindSpots` list and a `disclaimer` to be surfaced
 * in every report and every UI that shows the score. Omitting the disclaimer
 * in exports is a Principle 3 violation and is tested.
 */

import type { GraphNode } from "@sentinel/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BlindSpotKind =
  | "LOW_CONFIDENCE_UNCONFIRMED"    // flagged by normalizer, not yet confirmed
  | "ASSET_NO_USE_CASE"             // asset/model with no use-case edge
  | "USE_CASE_NO_ASSETS"            // use-case with no assets attached
  | "MANUAL_ONLY_NODE"              // node entered manually — no telemetry corroboration
  | "UNTAGGED_ASSET";               // asset with no tags — potential shadow AI

export interface BlindSpot {
  kind: BlindSpotKind;
  nodeId: string;
  label: string;
  description: string;
}

export interface CoverageReport {
  /** Nodes observed via live telemetry (source=TELEMETRY) */
  telemetryNodes: number;
  /** Nodes entered manually (source=MANUAL) */
  manualNodes: number;
  /** Total registered nodes */
  totalNodes: number;
  /**
   * Score = telemetryNodes / totalNodes, expressed as 0–100.
   * If totalNodes === 0, score is 0 (no estate registered yet).
   */
  coverageScore: number;
  /** Low-confidence nodes not yet confirmed by a human */
  unconfirmedLowConfidence: number;
  /** Enumerated blind spots — never exhaustive */
  blindSpots: BlindSpot[];
  /**
   * Mandatory disclaimer — MUST be shown in every report and every UI
   * surface that displays the coverage score. Omitting it violates Principle 3.
   */
  disclaimer: string;
  computedAt: Date;
}

// ---------------------------------------------------------------------------
// Calculator
// ---------------------------------------------------------------------------

export class CoverageCalculator {
  /**
   * Compute a coverage report from a flat list of nodes and an edge adjacency map.
   *
   * @param nodes      All GraphNode records from the repository
   * @param connectedNodeIds  Set of node ids that have at least one edge
   *                         (pass empty set if edges are not loaded)
   */
  compute(nodes: GraphNode[], connectedNodeIds: Set<string> = new Set()): CoverageReport {
    const telemetryNodes = nodes.filter((n) => n.source === "TELEMETRY").length;
    const manualNodes = nodes.filter((n) => n.source === "MANUAL").length;
    const totalNodes = nodes.length;

    const coverageScore =
      totalNodes === 0 ? 0 : Math.round((telemetryNodes / totalNodes) * 100);

    const unconfirmedLowConfidence = nodes.filter(
      (n) => n.confidence === "LOW" && !n.confirmed,
    ).length;

    const blindSpots: BlindSpot[] = [];

    for (const node of nodes) {
      // LOW confidence and not yet confirmed
      if (node.confidence === "LOW" && !node.confirmed) {
        blindSpots.push({
          kind: "LOW_CONFIDENCE_UNCONFIRMED",
          nodeId: node.id,
          label: node.label,
          description: `"${node.label}" was flagged during normalization as ambiguous. Human confirmation required.`,
        });
      }

      // Manual-only node (no telemetry backing)
      if (node.source === "MANUAL" && node.type !== "JURISDICTION") {
        blindSpots.push({
          kind: "MANUAL_ONLY_NODE",
          nodeId: node.id,
          label: node.label,
          description: `"${node.label}" was entered manually and has not been corroborated by live telemetry.`,
        });
      }

      // Asset or model with no use-case connection
      if (
        node.type === "ASSET" &&
        !connectedNodeIds.has(node.id)
      ) {
        blindSpots.push({
          kind: "ASSET_NO_USE_CASE",
          nodeId: node.id,
          label: node.label,
          description: `Asset "${node.label}" is not linked to any use-case — potential shadow AI.`,
        });
      }

      // Use-case with no assets
      if (node.type === "USE_CASE" && !connectedNodeIds.has(node.id)) {
        blindSpots.push({
          kind: "USE_CASE_NO_ASSETS",
          nodeId: node.id,
          label: node.label,
          description: `Use-case "${node.label}" has no assets or models attached — coverage is incomplete.`,
        });
      }
    }

    return {
      telemetryNodes,
      manualNodes,
      totalNodes,
      coverageScore,
      unconfirmedLowConfidence,
      blindSpots,
      disclaimer:
        "Coverage score reflects only the portion of the AI estate that Sentinel has observed " +
        "or been told about. Unregistered systems, shadow AI, and scopes outside current connector " +
        "permissions are NOT counted. This score is NOT a statement of completeness.",
      computedAt: new Date(),
    };
  }
}
