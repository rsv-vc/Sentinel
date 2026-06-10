/**
 * ComplianceEngine tests — Phase 5.
 *
 * Principle 5: output is obligations and gaps with an effective date.
 *   - NEVER a legal determination
 *   - disclaimer is ALWAYS present
 *
 * Principle 1: no insurance or risk-transfer language.
 */

import { ComplianceEngine } from "../compliance/ComplianceEngine";
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
// InMemoryRepo (same pattern)
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
      connectorId: null, confirmed: false,
      createdAt: existing?.createdAt ?? now, updatedAt: now,
    };
    this.nodes.set(input.id, node);
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

function addNode(repo: InMemoryRepo, partial: Partial<GraphNode> & { id: string; type: GraphNode["type"]; label: string }): GraphNode {
  const node: GraphNode = {
    confidence: "HIGH", source: "TELEMETRY",
    attributes: {} as object & Record<string, unknown>,
    connectorId: null, confirmed: false,
    createdAt: new Date(), updatedAt: new Date(),
    ...partial,
  };
  repo.nodes.set(node.id, node);
  return node;
}

function addEdge(repo: InMemoryRepo, fromId: string, toId: string, type: GraphEdge["type"]): void {
  const key = `${fromId}||${toId}||${type}`;
  repo.edges.set(key, { id: key, type, fromId, toId, attributes: {} as object & Record<string, unknown>, createdAt: new Date() });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ComplianceEngine — Principle 5: disclaimer always present", () => {
  it("report always contains a non-empty disclaimer string", async () => {
    const repo = new InMemoryRepo();
    const engine = new ComplianceEngine(repo);
    const uc = addNode(repo, { id: "uc::disc", type: "USE_CASE", label: "test-uc" });
    const report = await engine.assessUseCase(uc);
    expect(report.disclaimer).toBeTruthy();
    expect(report.disclaimer.length).toBeGreaterThan(20);
  });

  it("disclaimer does not contain the words 'legal determination' as a verdict", async () => {
    const repo = new InMemoryRepo();
    const engine = new ComplianceEngine(repo);
    const uc = addNode(repo, { id: "uc::disc2", type: "USE_CASE", label: "test-uc2" });
    const report = await engine.assessUseCase(uc);
    // The disclaimer MUST say it is NOT a legal determination
    expect(report.disclaimer).toMatch(/NOT a legal determination/i);
  });
});

describe("ComplianceEngine — GDPR obligations triggered by EU jurisdiction + data", () => {
  it("triggers GDPR obligations when EU jurisdiction and data asset are present", async () => {
    const repo = new InMemoryRepo();
    const engine = new ComplianceEngine(repo);

    const uc   = addNode(repo, { id: "uc::gdpr", type: "USE_CASE", label: "gdpr-uc" });
    const eu   = addNode(repo, { id: "jur::EU", type: "JURISDICTION", label: "European Union", attributes: { code: "EU" } as object & Record<string, unknown> });
    const data = addNode(repo, { id: "da::1", type: "DATA_ASSET", label: "user-data" });

    addEdge(repo, uc.id, eu.id, "SUBJECT_TO");
    addEdge(repo, uc.id, data.id, "STORES_DATA");

    const report = await engine.assessUseCase(uc);
    expect(report.jurisdictions).toContain("EU");
    expect(report.hasPersonalData).toBe(true);
    const gdprObs = report.applicableObligations.filter((o) => o.ruleSet.id === "gdpr");
    expect(gdprObs.length).toBeGreaterThan(0);
  });
});

describe("ComplianceEngine — cross-border transfer detection", () => {
  it("sets hasCrossBorderTransfer when both EU and US jurisdictions are present", async () => {
    const repo = new InMemoryRepo();
    const engine = new ComplianceEngine(repo);

    const uc = addNode(repo, { id: "uc::xb", type: "USE_CASE", label: "cross-border" });
    const eu = addNode(repo, { id: "jur::EU", type: "JURISDICTION", label: "EU", attributes: { code: "EU" } as object & Record<string, unknown> });
    const us = addNode(repo, { id: "jur::US", type: "JURISDICTION", label: "US", attributes: { code: "US" } as object & Record<string, unknown> });

    addEdge(repo, uc.id, eu.id, "SUBJECT_TO");
    addEdge(repo, uc.id, us.id, "SUBJECT_TO");

    const report = await engine.assessUseCase(uc);
    expect(report.hasCrossBorderTransfer).toBe(true);
  });
});

describe("ComplianceEngine — EU AI Act obligations", () => {
  it("triggers EU AI Act obligations for high-risk AI (EU + model + data)", async () => {
    const repo = new InMemoryRepo();
    const engine = new ComplianceEngine(repo);

    const uc    = addNode(repo, { id: "uc::euai", type: "USE_CASE", label: "euai-uc" });
    const eu    = addNode(repo, { id: "jur::EU2", type: "JURISDICTION", label: "EU", attributes: { code: "EU" } as object & Record<string, unknown> });
    const data  = addNode(repo, { id: "da::euai", type: "DATA_ASSET", label: "personal-data" });
    const model = addNode(repo, { id: "asset::model::euai", type: "ASSET", label: "GPT-4o", attributes: { kind: "MODEL_DEPLOYMENT" } as object & Record<string, unknown> });

    addEdge(repo, uc.id, eu.id, "SUBJECT_TO");
    addEdge(repo, uc.id, data.id, "STORES_DATA");
    addEdge(repo, uc.id, model.id, "USES_MODEL");

    const report = await engine.assessUseCase(uc);
    const euaiObs = report.applicableObligations.filter((o) => o.ruleSet.id === "eu-ai-act");
    expect(euaiObs.length).toBeGreaterThan(0);
  });
});

describe("ComplianceEngine — rule-set versions are present on every obligation", () => {
  it("every applicable obligation includes a non-empty ruleSet version and effectiveDate", async () => {
    const repo = new InMemoryRepo();
    const engine = new ComplianceEngine(repo);

    const uc   = addNode(repo, { id: "uc::ver", type: "USE_CASE", label: "ver-uc" });
    const eu   = addNode(repo, { id: "jur::EU3", type: "JURISDICTION", label: "EU", attributes: { code: "EU" } as object & Record<string, unknown> });
    const data = addNode(repo, { id: "da::ver", type: "DATA_ASSET", label: "data" });

    addEdge(repo, uc.id, eu.id, "SUBJECT_TO");
    addEdge(repo, uc.id, data.id, "STORES_DATA");

    const report = await engine.assessUseCase(uc);
    for (const ob of report.applicableObligations) {
      expect(ob.ruleSet.version).toBeTruthy();
      expect(ob.effectiveDate).toBeTruthy();
    }
  });
});
