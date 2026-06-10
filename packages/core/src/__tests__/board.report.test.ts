/**
 * BoardReportBuilder tests — Phase 6.
 *
 * Principle 3: coverage score + blind spots ALWAYS in the report.
 * Principle 5: compliance disclaimer ALWAYS in the report.
 * Principle 1: no insurance/risk-transfer language in any report section.
 */

import { BoardReportBuilder } from "../reports/BoardReportBuilder";
import { NormalizationService } from "../normalization.service";
import { MockCloudConnector } from "@sentinel/connectors";
import type {
  AppendEventInput,
  CreateEdgeInput,
  Event,
  GraphEdge,
  GraphNode,
  IGraphRepository,
  NodeWithEdges,
  UpsertNodeInput,
} from "@sentinel/db";
import type { NodeType } from "@sentinel/db";

// ---------------------------------------------------------------------------
// InMemoryRepo
// ---------------------------------------------------------------------------

class InMemoryRepo implements IGraphRepository {
  nodes = new Map<string, GraphNode>();
  edges = new Map<string, GraphEdge>();
  events: Event[] = [];

  async upsertNode(input: UpsertNodeInput): Promise<GraphNode> {
    const now = new Date();
    const existing = this.nodes.get(input.id);
    const node: GraphNode = {
      id: input.id, type: input.type, label: input.label,
      attributes: (input.attributes ?? {}) as object & Record<string, unknown>,
      confidence: input.confidence ?? "HIGH", source: input.source ?? "TELEMETRY",
      connectorId: input.connectorId ?? null, confirmed: existing?.confirmed ?? false,
      createdAt: existing?.createdAt ?? now, updatedAt: now,
    };
    this.nodes.set(input.id, node);
    await this.appendEvent({ type: existing ? "NODE_UPDATED" : "NODE_CREATED", nodeId: input.id });
    return node;
  }
  async getNode(id: string) { return this.nodes.get(id) ?? null; }
  async listNodes(type?: NodeType) {
    const all = Array.from(this.nodes.values());
    return type ? all.filter((n) => n.type === type) : all;
  }
  async getNodeWithEdges(id: string): Promise<NodeWithEdges | null> {
    const node = this.nodes.get(id);
    if (!node) return null;
    const all = Array.from(this.edges.values());
    return { ...node, edgesFrom: all.filter((e) => e.fromId === id), edgesTo: all.filter((e) => e.toId === id) };
  }
  async upsertEdge(input: CreateEdgeInput): Promise<GraphEdge> {
    const key = `${input.fromId}||${input.toId}||${input.type}`;
    const edge: GraphEdge = { id: key, type: input.type, fromId: input.fromId, toId: input.toId, attributes: {} as object & Record<string, unknown>, createdAt: new Date() };
    this.edges.set(key, edge);
    return edge;
  }
  async getEdgesByNode(nodeId: string) {
    return Array.from(this.edges.values()).filter((e) => e.fromId === nodeId || e.toId === nodeId);
  }
  async appendEvent(input: AppendEventInput): Promise<Event> {
    const evt: Event = { id: `e${this.events.length + 1}`, type: input.type, nodeId: input.nodeId ?? null, payload: {} as object & Record<string, unknown>, actor: "system", connectorId: null, createdAt: new Date() };
    this.events.push(evt);
    return evt;
  }
  async getNodeHistory(nodeId: string) { return this.events.filter((e) => e.nodeId === nodeId); }
  async listRecentEvents(limit = 50) { return this.events.slice(-limit).reverse(); }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function buildPopulatedRepo(): Promise<InMemoryRepo> {
  const repo      = new InMemoryRepo();
  const connector = new MockCloudConnector();
  const norm      = new NormalizationService(repo);
  await norm.normalize(connector, "test");
  return repo;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BoardReportBuilder — Principle 3: coverage score always present", () => {
  it("report.coverage.score is defined (0–100)", async () => {
    const repo   = await buildPopulatedRepo();
    const builder = new BoardReportBuilder(repo);
    const report  = await builder.build();
    expect(report.coverage.score).toBeGreaterThanOrEqual(0);
    expect(report.coverage.score).toBeLessThanOrEqual(100);
  });

  it("report.coverage.disclaimer is a non-empty string", async () => {
    const repo   = await buildPopulatedRepo();
    const builder = new BoardReportBuilder(repo);
    const report  = await builder.build();
    expect(report.coverage.disclaimer).toBeTruthy();
    expect(report.coverage.disclaimer.length).toBeGreaterThan(20);
  });

  it("report.coverage.blindSpots is always an array (never undefined)", async () => {
    const repo   = new InMemoryRepo(); // empty graph
    const builder = new BoardReportBuilder(repo);
    const report  = await builder.build();
    expect(Array.isArray(report.coverage.blindSpots)).toBe(true);
  });

  it("coverage node totals sum correctly", async () => {
    const repo   = await buildPopulatedRepo();
    const builder = new BoardReportBuilder(repo);
    const report  = await builder.build();
    expect(report.coverage.telemetryNodes + report.coverage.manualNodes)
      .toBeLessThanOrEqual(report.coverage.totalNodes);
  });
});

describe("BoardReportBuilder — Principle 5: compliance disclaimer always present", () => {
  it("report.compliance.disclaimer is always present and non-empty", async () => {
    const repo   = await buildPopulatedRepo();
    const builder = new BoardReportBuilder(repo);
    const report  = await builder.build();
    expect(report.compliance.disclaimer).toBeTruthy();
    expect(report.compliance.disclaimer).toMatch(/NOT a legal determination/i);
  });

  it("compliance disclaimer present even on empty graph", async () => {
    const repo   = new InMemoryRepo();
    const builder = new BoardReportBuilder(repo);
    const report  = await builder.build();
    expect(report.compliance.disclaimer).toBeTruthy();
  });
});

describe("BoardReportBuilder — Principle 1: no risk-transfer language", () => {
  it("no insurance/risk-transfer language appears anywhere in the report", async () => {
    const repo   = await buildPopulatedRepo();
    const builder = new BoardReportBuilder(repo);
    const report  = await builder.build();

    // Serialise to string and scan
    const FORBIDDEN = /\b(insur[ae]|indemnif|reinsur|risk.swap|risk.transfer|risk.broker)\b/i;
    const allText = JSON.stringify(report);
    expect(allText).not.toMatch(FORBIDDEN);
  });
});

describe("BoardReportBuilder — meta fields", () => {
  it("meta.generatedAt is a valid ISO string", async () => {
    const repo   = await buildPopulatedRepo();
    const builder = new BoardReportBuilder(repo);
    const report  = await builder.build({ totalSyncRuns: 7 });
    expect(() => new Date(report.meta.generatedAt).toISOString()).not.toThrow();
    expect(report.meta.totalSyncRuns).toBe(7);
  });

  it("risk.useCaseSummaries length equals the number of USE_CASE nodes", async () => {
    const repo     = await buildPopulatedRepo();
    const ucCount  = (await repo.listNodes("USE_CASE")).length;
    const builder  = new BoardReportBuilder(repo);
    const report   = await builder.build();
    expect(report.risk.useCaseSummaries.length).toBe(ucCount);
  });
});
