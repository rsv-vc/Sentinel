import { CoverageCalculator } from "../coverage";
import type { GraphNode } from "@sentinel/db";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(overrides: Partial<GraphNode> & { id: string }): GraphNode {
  return {
    type: "ASSET",
    label: overrides.id,
    attributes: {},
    confidence: "HIGH",
    source: "TELEMETRY",
    confirmed: false,
    connectorId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as GraphNode;
}

const calc = new CoverageCalculator();

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------

describe("CoverageCalculator — score", () => {
  it("returns score 0 for empty estate", () => {
    const report = calc.compute([]);
    expect(report.coverageScore).toBe(0);
    expect(report.totalNodes).toBe(0);
  });

  it("returns 100 when all nodes are from telemetry", () => {
    const nodes = [makeNode({ id: "a" }), makeNode({ id: "b" })];
    expect(calc.compute(nodes).coverageScore).toBe(100);
  });

  it("returns 50 when half the nodes are manual", () => {
    const nodes = [
      makeNode({ id: "a", source: "TELEMETRY" }),
      makeNode({ id: "b", source: "MANUAL" }),
    ];
    expect(calc.compute(nodes).coverageScore).toBe(50);
  });

  it("counts telemetryNodes and manualNodes correctly", () => {
    const nodes = [
      makeNode({ id: "a", source: "TELEMETRY" }),
      makeNode({ id: "b", source: "TELEMETRY" }),
      makeNode({ id: "c", source: "MANUAL" }),
    ];
    const r = calc.compute(nodes);
    expect(r.telemetryNodes).toBe(2);
    expect(r.manualNodes).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Principle 3 — disclaimer always present
// ---------------------------------------------------------------------------

describe("CoverageCalculator — Principle 3 (Evidenced, not complete)", () => {
  it("always returns a non-empty disclaimer", () => {
    expect(calc.compute([]).disclaimer.length).toBeGreaterThan(20);
  });

  it("disclaimer is present even at 100% coverage", () => {
    const nodes = [makeNode({ id: "a" }), makeNode({ id: "b" })];
    expect(calc.compute(nodes).disclaimer).toBeTruthy();
  });

  it("disclaimer mentions that the score is NOT a statement of completeness", () => {
    const report = calc.compute([]);
    expect(report.disclaimer.toLowerCase()).toContain("not");
    expect(report.disclaimer.toLowerCase()).toMatch(/complet/);
  });
});

// ---------------------------------------------------------------------------
// Blind spots
// ---------------------------------------------------------------------------

describe("CoverageCalculator — blind spots", () => {
  it("flags LOW_CONFIDENCE_UNCONFIRMED for low-confidence unconfirmed nodes", () => {
    const nodes = [makeNode({ id: "x", confidence: "LOW", confirmed: false })];
    const { blindSpots } = calc.compute(nodes);
    expect(blindSpots.some((b) => b.kind === "LOW_CONFIDENCE_UNCONFIRMED")).toBe(true);
  });

  it("does NOT flag a LOW confidence node that has been confirmed", () => {
    const nodes = [makeNode({ id: "x", confidence: "LOW", confirmed: true })];
    const { blindSpots } = calc.compute(nodes);
    expect(blindSpots.some((b) => b.kind === "LOW_CONFIDENCE_UNCONFIRMED")).toBe(false);
  });

  it("flags MANUAL_ONLY_NODE for non-jurisdiction manual nodes", () => {
    const nodes = [makeNode({ id: "m", source: "MANUAL", type: "ASSET" })];
    const { blindSpots } = calc.compute(nodes);
    expect(blindSpots.some((b) => b.kind === "MANUAL_ONLY_NODE")).toBe(true);
  });

  it("does NOT flag MANUAL_ONLY_NODE for JURISDICTION nodes (they are always manual reference data)", () => {
    const nodes = [makeNode({ id: "j", source: "MANUAL", type: "JURISDICTION" })];
    const { blindSpots } = calc.compute(nodes);
    expect(blindSpots.some((b) => b.kind === "MANUAL_ONLY_NODE")).toBe(false);
  });

  it("flags ASSET_NO_USE_CASE for disconnected asset nodes", () => {
    const nodes = [makeNode({ id: "asset-1", type: "ASSET" })];
    const { blindSpots } = calc.compute(nodes, new Set()); // empty connected set
    expect(blindSpots.some((b) => b.kind === "ASSET_NO_USE_CASE")).toBe(true);
  });

  it("does NOT flag ASSET_NO_USE_CASE when asset is connected", () => {
    const nodes = [makeNode({ id: "asset-1", type: "ASSET" })];
    const { blindSpots } = calc.compute(nodes, new Set(["asset-1"]));
    expect(blindSpots.some((b) => b.kind === "ASSET_NO_USE_CASE")).toBe(false);
  });

  it("counts unconfirmedLowConfidence correctly", () => {
    const nodes = [
      makeNode({ id: "a", confidence: "LOW", confirmed: false }),
      makeNode({ id: "b", confidence: "LOW", confirmed: true }),
      makeNode({ id: "c", confidence: "HIGH" }),
    ];
    expect(calc.compute(nodes).unconfirmedLowConfidence).toBe(1);
  });

  it("returns a computedAt timestamp", () => {
    const before = Date.now();
    const report = calc.compute([]);
    expect(report.computedAt.getTime()).toBeGreaterThanOrEqual(before);
  });
});
