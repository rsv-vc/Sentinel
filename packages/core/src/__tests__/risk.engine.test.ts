/**
 * RiskEngine tests — Phase 5.
 *
 * Principle 1: no insurance / risk-transfer features anywhere.
 * Principle 5: output is obligations and gaps, never a legal verdict.
 *
 * Uses the same InMemoryRepo pattern as other core tests.
 */

import { RiskEngine } from "../risk/RiskEngine";
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
      connectorId: input.connectorId ?? null, confirmed: false,
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

function addNode(repo: InMemoryRepo, partial: Partial<GraphNode> & { id: string; type: GraphNode["type"]; label: string }): GraphNode {
  const node: GraphNode = {
    confidence: "HIGH",
    source: "TELEMETRY",
    attributes: {} as object & Record<string, unknown>,
    connectorId: null,
    confirmed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
  repo.nodes.set(node.id, node);
  return node;
}

function addEdge(repo: InMemoryRepo, fromId: string, toId: string, type: GraphEdge["type"]): void {
  const key = `${fromId}||${toId}||${type}`;
  repo.edges.set(key, {
    id: key, type, fromId, toId,
    attributes: {} as object & Record<string, unknown>,
    createdAt: new Date(),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RiskEngine — model behaviour is always UN_ASSESSED without eval evidence", () => {
  it("returns UN_ASSESSED for modelBehaviour when no evalStatus attribute is set", async () => {
    const repo = new InMemoryRepo();
    const engine = new RiskEngine(repo);

    const uc = addNode(repo, { id: "uc::1", type: "USE_CASE", label: "fraud-detection" });
    const model = addNode(repo, { id: "asset::model::1", type: "ASSET", label: "GPT-4o", attributes: { kind: "MODEL_DEPLOYMENT" } as object & Record<string, unknown> });
    addEdge(repo, uc.id, model.id, "USES_MODEL");

    const report = await engine.scoreUseCase(uc);
    expect(report.dimensions.modelBehaviour.level).toBe("UN_ASSESSED");
    expect(report.residualLevel).toBe("UN_ASSESSED");
  });

  it("residual is UN_ASSESSED even when all other dimensions are LOW", async () => {
    const repo = new InMemoryRepo();
    const engine = new RiskEngine(repo);

    // Minimal use-case — no assets, no vendors, no model
    const uc = addNode(repo, { id: "uc::empty", type: "USE_CASE", label: "empty-uc" });

    const report = await engine.scoreUseCase(uc);
    // modelBehaviour = UN_ASSESSED (no models present, still UN_ASSESSED per design)
    expect(report.dimensions.modelBehaviour.level).toBe("UN_ASSESSED");
    expect(report.residualLevel).toBe("UN_ASSESSED");
  });
});

describe("RiskEngine — vendor dimension", () => {
  it("scores HIGH when there is a single vendor", async () => {
    const repo = new InMemoryRepo();
    const engine = new RiskEngine(repo);

    const uc = addNode(repo, { id: "uc::v1", type: "USE_CASE", label: "uc-single-vendor" });
    const vendor = addNode(repo, { id: "vendor::openai", type: "VENDOR", label: "OpenAI" });
    addEdge(repo, uc.id, vendor.id, "OWNED_BY_VENDOR");

    const report = await engine.scoreUseCase(uc);
    expect(report.dimensions.vendor.level).toBe("HIGH");
    expect(report.dimensions.vendor.signals.some((s) => s.includes("Single-vendor"))).toBe(true);
  });

  it("scores MEDIUM when there are multiple vendors", async () => {
    const repo = new InMemoryRepo();
    const engine = new RiskEngine(repo);

    const uc = addNode(repo, { id: "uc::v2", type: "USE_CASE", label: "uc-multi-vendor" });
    const v1 = addNode(repo, { id: "vendor::openai", type: "VENDOR", label: "OpenAI" });
    const v2 = addNode(repo, { id: "vendor::anthropic", type: "VENDOR", label: "Anthropic" });
    addEdge(repo, uc.id, v1.id, "OWNED_BY_VENDOR");
    addEdge(repo, uc.id, v2.id, "OWNED_BY_VENDOR");

    const report = await engine.scoreUseCase(uc);
    expect(report.dimensions.vendor.level).toBe("MEDIUM");
  });
});

describe("RiskEngine — Principle 1 enforcement (no risk-transfer language)", () => {
  it("risk report hints must not contain insurance/transfer language", async () => {
    const repo = new InMemoryRepo();
    const engine = new RiskEngine(repo);
    const uc = addNode(repo, { id: "uc::p1", type: "USE_CASE", label: "uc-p1" });
    const report = await engine.scoreUseCase(uc);

    // Principle 1 forbids risk/financial transfer, not legitimate data-transfer references
    const FORBIDDEN = /\b(insur[ae]|indemnif|reinsur|risk.swap|risk.transfer|risk.broker)\b/i;
    const allHints = Object.values(report.dimensions).flatMap((d) => d.hints);
    for (const hint of allHints) {
      expect(hint).not.toMatch(FORBIDDEN);
    }
  });
});

describe("RiskEngine — portfolio report", () => {
  it("flags vendors present in ≥40% of use-cases", async () => {
    const repo = new InMemoryRepo();
    const engine = new RiskEngine(repo);

    const vendor = addNode(repo, { id: "vendor::dominant", type: "VENDOR", label: "DominantCo" });

    for (let i = 0; i < 5; i++) {
      const uc = addNode(repo, { id: `uc::portfolio::${i}`, type: "USE_CASE", label: `uc-${i}` });
      addEdge(repo, uc.id, vendor.id, "OWNED_BY_VENDOR");
    }

    const portfolio = await engine.portfolioReport();
    expect(portfolio.totalUseCases).toBe(5);
    const flag = portfolio.concentrationFlags.find((f) => f.vendorId === vendor.id);
    expect(flag).toBeDefined();
    expect(flag!.portfolioShare).toBe(100);
  });
});
