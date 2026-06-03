import express from "express";
import request from "supertest";
import { Router } from "express";
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
import { nodeId as makeNodeId, CoverageCalculator } from "@sentinel/core";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// In-memory stub (same pattern as graph.routes.test.ts)
// ---------------------------------------------------------------------------

class InMemoryRepo implements IGraphRepository {
  nodes = new Map<string, GraphNode>();
  edges = new Map<string, GraphEdge>();
  events: Event[] = [];

  async upsertNode(input: UpsertNodeInput): Promise<GraphNode> {
    const now = new Date();
    const existing = this.nodes.get(input.id);
    // Handle the "confirm" upsert which sets confirmed=true
    const confirmed = input.confidence === "MEDIUM" && existing?.confidence === "LOW"
      ? true
      : existing?.confirmed ?? false;
    const node: GraphNode = {
      id: input.id, type: input.type, label: input.label,
      attributes: (input.attributes ?? {}) as object & Record<string, unknown>,
      confidence: input.confidence ?? "HIGH",
      source: input.source ?? "TELEMETRY",
      connectorId: input.connectorId ?? null,
      confirmed,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.nodes.set(input.id, node);
    await this.appendEvent({ type: existing ? "NODE_UPDATED" : "NODE_CREATED", nodeId: input.id });
    if (input.confidence === "LOW" && !existing) {
      await this.appendEvent({ type: "NODE_FLAGGED_LOW_CONFIDENCE", nodeId: input.id });
    }
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
    const evt: Event = { id: `e${this.events.length + 1}`, type: input.type, nodeId: input.nodeId ?? null, payload: {} as object & Record<string, unknown>, actor: input.actor ?? "system", connectorId: null, createdAt: new Date() };
    this.events.push(evt);
    return evt;
  }
  async getNodeHistory(nodeId: string) { return this.events.filter((e) => e.nodeId === nodeId); }
  async listRecentEvents(limit = 50) { return this.events.slice(-limit).reverse(); }
}

// ---------------------------------------------------------------------------
// Build test app
// ---------------------------------------------------------------------------

function buildApp(repo: InMemoryRepo) {
  const app = express();
  app.use(express.json());

  // Nodes router (inline for test isolation)
  const VALID_NODE_TYPES: NodeType[] = ["USE_CASE", "ASSET", "VENDOR", "DATA_ASSET", "JURISDICTION"];
  const nodesRouter = Router();

  nodesRouter.get("/", async (req, res) => {
    const type = req.query.type as NodeType | undefined;
    const nodes = await repo.listNodes(type);
    res.json({ data: nodes, count: nodes.length });
  });

  nodesRouter.get("/:id", async (req, res) => {
    const node = await repo.getNodeWithEdges(req.params.id);
    if (!node) { res.status(404).json({ error: "Not found" }); return; }
    res.json(node);
  });

  nodesRouter.post("/", async (req, res) => {
    const { type, label, attributes = {}, actor = "user" } = req.body;
    if (!type || !VALID_NODE_TYPES.includes(type)) { res.status(400).json({ error: "invalid type" }); return; }
    if (!label?.trim()) { res.status(400).json({ error: "label required" }); return; }
    const id = type === "USE_CASE" ? makeNodeId.useCase(label)
              : type === "VENDOR" ? makeNodeId.vendor(label)
              : `${(type as string).toLowerCase()}::manual::${randomUUID()}`;
    const node = await repo.upsertNode({ id, type, label: label.trim(), attributes, confidence: "LOW", source: "MANUAL", actor });
    res.status(201).json(node);
  });

  nodesRouter.patch("/:id", async (req, res) => {
    const existing = await repo.getNode(req.params.id);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const { label, attributes, actor = "user" } = req.body;
    const node = await repo.upsertNode({
      id: existing.id, type: existing.type,
      label: label?.trim() ?? existing.label,
      attributes: attributes ?? existing.attributes as Record<string, unknown>,
      confidence: existing.confidence, source: existing.source, actor,
    });
    res.json(node);
  });

  nodesRouter.post("/:id/confirm", async (req, res) => {
    const node = await repo.getNode(req.params.id);
    if (!node) { res.status(404).json({ error: "Not found" }); return; }
    if (node.confidence !== "LOW") { res.status(400).json({ error: "only LOW nodes need confirmation" }); return; }
    const actor = req.body?.actor ?? "user";
    await repo.upsertNode({ id: node.id, type: node.type, label: node.label, attributes: node.attributes as Record<string, unknown>, confidence: "MEDIUM", source: node.source, actor });
    await repo.appendEvent({ type: "NODE_CONFIRMED", nodeId: node.id, actor });
    const updated = await repo.getNode(node.id);
    res.json({ ok: true, node: updated });
  });

  app.use("/api/nodes", nodesRouter);

  // Coverage router
  const coverageRouter = Router();
  const calc = new CoverageCalculator();
  coverageRouter.get("/", async (_req, res) => {
    const nodes = await repo.listNodes();
    const connectedIds = new Set<string>();
    for (const n of nodes) {
      const edges = await repo.getEdgesByNode(n.id);
      if (edges.length > 0) connectedIds.add(n.id);
    }
    res.json(calc.compute(nodes, connectedIds));
  });
  app.use("/api/coverage", coverageRouter);

  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let repo: InMemoryRepo;
let app: express.Express;

beforeEach(() => {
  repo = new InMemoryRepo();
  app = buildApp(repo);
});

describe("POST /api/nodes — manual create", () => {
  it("creates a USE_CASE node with source=MANUAL and confidence=LOW", async () => {
    const res = await request(app)
      .post("/api/nodes")
      .send({ type: "USE_CASE", label: "KYC Screening" });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe("MANUAL");
    expect(res.body.confidence).toBe("LOW");
    expect(res.body.label).toBe("KYC Screening");
  });

  it("rejects missing label", async () => {
    const res = await request(app).post("/api/nodes").send({ type: "USE_CASE" });
    expect(res.status).toBe(400);
  });

  it("rejects invalid node type", async () => {
    const res = await request(app).post("/api/nodes").send({ type: "WIDGET", label: "x" });
    expect(res.status).toBe(400);
  });

  it("writes a NODE_FLAGGED_LOW_CONFIDENCE event for new manual nodes", async () => {
    await request(app).post("/api/nodes").send({ type: "USE_CASE", label: "AML Screening" });
    const flagEvents = repo.events.filter((e) => e.type === "NODE_FLAGGED_LOW_CONFIDENCE");
    expect(flagEvents.length).toBeGreaterThan(0);
  });
});

describe("PATCH /api/nodes/:id — annotate", () => {
  it("updates label and writes an event", async () => {
    const create = await request(app).post("/api/nodes").send({ type: "USE_CASE", label: "Old Label" });
    const id = create.body.id;
    const patch = await request(app).patch(`/api/nodes/${id}`).send({ label: "New Label" });
    expect(patch.status).toBe(200);
    expect(patch.body.label).toBe("New Label");
    const history = repo.events.filter((e) => e.nodeId === id);
    expect(history.some((e) => e.type === "NODE_UPDATED")).toBe(true);
  });

  it("returns 404 for unknown node", async () => {
    const res = await request(app).patch("/api/nodes/bad-id").send({ label: "x" });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/nodes/:id/confirm — low-confidence confirmation", () => {
  it("upgrades confidence LOW → MEDIUM and writes NODE_CONFIRMED event", async () => {
    const create = await request(app).post("/api/nodes").send({ type: "USE_CASE", label: "Shadow UC" });
    const id = create.body.id;
    const confirm = await request(app).post(`/api/nodes/${id}/confirm`).send({ actor: "alice@acme.com" });
    expect(confirm.status).toBe(200);
    expect(confirm.body.ok).toBe(true);
    expect(confirm.body.node.confidence).toBe("MEDIUM");
    const confirmEvents = repo.events.filter((e) => e.type === "NODE_CONFIRMED");
    expect(confirmEvents.length).toBe(1);
  });

  it("returns 400 when node is not LOW confidence", async () => {
    await repo.upsertNode({ id: "n1", type: "ASSET", label: "GPU", confidence: "HIGH", source: "TELEMETRY" });
    const res = await request(app).post("/api/nodes/n1/confirm").send({});
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown node", async () => {
    const res = await request(app).post("/api/nodes/no-such/confirm").send({});
    expect(res.status).toBe(404);
  });
});

describe("GET /api/coverage — Principle 3", () => {
  it("always returns a disclaimer", async () => {
    const res = await request(app).get("/api/coverage");
    expect(res.status).toBe(200);
    expect(res.body.disclaimer).toBeTruthy();
    expect(res.body.disclaimer.length).toBeGreaterThan(20);
  });

  it("returns coverageScore 0 for empty estate", async () => {
    const res = await request(app).get("/api/coverage");
    expect(res.body.coverageScore).toBe(0);
  });

  it("score rises after adding a telemetry node", async () => {
    await repo.upsertNode({ id: "t1", type: "ASSET", label: "GPU", confidence: "HIGH", source: "TELEMETRY" });
    const res = await request(app).get("/api/coverage");
    expect(res.body.coverageScore).toBe(100);
  });

  it("manual node appears in blindSpots as MANUAL_ONLY_NODE", async () => {
    await request(app).post("/api/nodes").send({ type: "ASSET", label: "Mystery Box" });
    const res = await request(app).get("/api/coverage");
    expect(res.body.blindSpots.some((b: { kind: string }) => b.kind === "MANUAL_ONLY_NODE")).toBe(true);
  });
});
