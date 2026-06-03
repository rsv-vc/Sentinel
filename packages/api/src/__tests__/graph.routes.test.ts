/**
 * Graph route smoke tests — use supertest against an Express instance
 * that is wired to an in-memory repository stub (no Postgres required).
 */

import express from "express";
import request from "supertest";
import { Router } from "express";
import { NormalizationService } from "@sentinel/core";
import { MockCloudConnector, ConnectorRegistry } from "@sentinel/connectors";
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
// Re-use the same in-memory stub from core tests
// ---------------------------------------------------------------------------

class InMemoryGraphRepository implements IGraphRepository {
  nodes = new Map<string, GraphNode>();
  edges = new Map<string, GraphEdge>();
  events: Event[] = [];

  async upsertNode(input: UpsertNodeInput): Promise<GraphNode> {
    const now = new Date();
    const existing = this.nodes.get(input.id);
    const node: GraphNode = {
      id: input.id,
      type: input.type,
      label: input.label,
      attributes: (input.attributes ?? {}) as object & Record<string, unknown>,
      confidence: input.confidence ?? "HIGH",
      source: input.source ?? "TELEMETRY",
      connectorId: input.connectorId ?? null,
      confirmed: false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
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
    const allEdges = Array.from(this.edges.values());
    return { ...node, edgesFrom: allEdges.filter((e) => e.fromId === id), edgesTo: allEdges.filter((e) => e.toId === id) };
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
// Build a test Express app wired to the stub
// ---------------------------------------------------------------------------

function buildTestApp(repo: InMemoryGraphRepository) {
  const app = express();
  app.use(express.json());

  const router = Router();
  const registry = new ConnectorRegistry();
  const connector = new MockCloudConnector();
  registry.register(connector, ["read:assets"]);
  const normalizer = new NormalizationService(repo);

  router.get("/use-cases", async (_req, res) => {
    const nodes = await repo.listNodes("USE_CASE");
    res.json({ data: nodes, count: nodes.length });
  });

  router.get("/use-cases/:id/graph", async (req, res) => {
    const root = await repo.getNodeWithEdges(req.params.id);
    if (!root) { res.status(404).json({ error: "Not found" }); return; }
    const connectedIds = new Set([...root.edgesFrom.map((e: GraphEdge) => e.toId), ...root.edgesTo.map((e: GraphEdge) => e.fromId)]);
    const neighbours = (await Promise.all([...connectedIds].map((id) => repo.getNode(id)))).filter(Boolean);
    res.json({ root, neighbours, edges: [...root.edgesFrom, ...root.edgesTo] });
  });

  router.get("/nodes/:id/history", async (req, res) => {
    const node = await repo.getNode(req.params.id);
    if (!node) { res.status(404).json({ error: "Not found" }); return; }
    const events = await repo.getNodeHistory(req.params.id);
    res.json({ node, events, count: events.length });
  });

  router.get("/graph/recent-events", async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const events = await repo.listRecentEvents(limit);
    res.json({ data: events, count: events.length });
  });

  router.post("/sync", async (_req, res) => {
    const result = await normalizer.normalize(connector);
    res.json({ ok: true, result });
  });

  router.get("/connectors", (_req, res) => {
    const records = registry.list().map((r: { connector: { id: string }; status: string }) => ({ id: r.connector.id, status: r.status }));
    res.json({ data: records, count: records.length });
  });

  app.use("/api", router);
  return app;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let repo: InMemoryGraphRepository;
let app: express.Express;

beforeEach(() => {
  repo = new InMemoryGraphRepository();
  app = buildTestApp(repo);
});

describe("GET /api/use-cases", () => {
  it("returns 200 with empty list before sync", async () => {
    const res = await request(app).get("/api/use-cases");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it("returns use-case nodes after a sync", async () => {
    await request(app).post("/api/sync");
    const res = await request(app).get("/api/use-cases");
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
  });
});

describe("GET /api/use-cases/:id/graph", () => {
  it("returns 404 for unknown id", async () => {
    const res = await request(app).get("/api/use-cases/nonexistent");
    expect(res.status).toBe(404);
  });

  it("returns root + neighbours after sync", async () => {
    await request(app).post("/api/sync");
    const listRes = await request(app).get("/api/use-cases");
    const ucId = listRes.body.data[0].id;
    const res = await request(app).get(`/api/use-cases/${ucId}/graph`);
    expect(res.status).toBe(200);
    expect(res.body.root.id).toBe(ucId);
    expect(Array.isArray(res.body.edges)).toBe(true);
  });
});

describe("GET /api/nodes/:id/history", () => {
  it("returns events for a known node", async () => {
    await request(app).post("/api/sync");
    const listRes = await request(app).get("/api/use-cases");
    const nodeId = listRes.body.data[0].id;
    const res = await request(app).get(`/api/nodes/${nodeId}/history`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it("returns 404 for unknown node", async () => {
    const res = await request(app).get("/api/nodes/no-such-node/history");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/graph/recent-events", () => {
  it("returns events after sync", async () => {
    await request(app).post("/api/sync");
    const res = await request(app).get("/api/graph/recent-events");
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
  });
});

describe("POST /api/sync", () => {
  it("returns ok:true with result summary", async () => {
    const res = await request(app).post("/api/sync");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.result.nodesUpserted).toBeGreaterThan(0);
  });
});

describe("GET /api/connectors", () => {
  it("returns the registered connector", async () => {
    const res = await request(app).get("/api/connectors");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].id).toBe("mock-cloud-connector-v1");
  });
});
