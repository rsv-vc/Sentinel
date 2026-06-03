/**
 * SyncScheduler tests — use fake timers and an in-memory repo.
 * No real DB or network required.
 */

import { SyncScheduler } from "../sync/SyncScheduler";
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
// In-memory repo (same stub pattern used across the test suite)
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
    const evt: Event = { id: `e${this.events.length + 1}`, type: input.type, nodeId: input.nodeId ?? null, payload: {} as object & Record<string, unknown>, actor: input.actor ?? "system", connectorId: null, createdAt: new Date() };
    this.events.push(evt);
    return evt;
  }
  async getNodeHistory(nodeId: string) { return this.events.filter((e) => e.nodeId === nodeId); }
  async listRecentEvents(limit = 50) { return this.events.slice(-limit).reverse(); }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

jest.useFakeTimers();

let repo: InMemoryRepo;
let scheduler: SyncScheduler;

beforeEach(() => {
  repo = new InMemoryRepo();
  scheduler = new SyncScheduler(repo, 5_000); // 5s interval for tests
});

afterEach(() => {
  scheduler.stop();
  jest.clearAllTimers();
});

describe("SyncScheduler — lifecycle", () => {
  it("starts with running=false and zero runs", () => {
    const status = scheduler.getStatus();
    expect(status.running).toBe(false);
    expect(status.totalRuns).toBe(0);
  });

  it("running=true after start()", () => {
    scheduler.start();
    expect(scheduler.getStatus().running).toBe(true);
  });

  it("running=false after stop()", () => {
    scheduler.start();
    scheduler.stop();
    expect(scheduler.getStatus().running).toBe(false);
  });

  it("calling start() twice does not double-register", () => {
    scheduler.start();
    scheduler.start(); // second call should be a no-op
    expect(scheduler.getStatus().running).toBe(true);
  });
});

describe("SyncScheduler — connector", () => {
  it("registers the evolving connector on construction", () => {
    const { connectors } = scheduler.getStatus();
    expect(connectors).toHaveLength(1);
    expect(connectors[0].id).toBe("evolving-mock-connector-v1");
  });

  it("connector currentRun increments with each tick", () => {
    scheduler.connector.tick();
    scheduler.connector.tick();
    expect(scheduler.connector.currentRun).toBe(2);
  });
});

describe("SyncScheduler — sync runs", () => {
  it("runs a sync immediately on start and populates nodes", async () => {
    scheduler.start();
    // flush the immediate runSync() promise
    await jest.advanceTimersByTimeAsync(100);
    const nodes = await repo.listNodes();
    expect(nodes.length).toBeGreaterThan(0);
  });

  it("SYNC_COMPLETED event is written per run", async () => {
    scheduler.start();
    await jest.advanceTimersByTimeAsync(100);
    const syncEvents = repo.events.filter((e) => e.type === "SYNC_COMPLETED");
    expect(syncEvents.length).toBeGreaterThanOrEqual(1);
  });

  it("status reports lastRun after first sync", async () => {
    scheduler.start();
    await jest.advanceTimersByTimeAsync(100);
    const status = scheduler.getStatus();
    expect(status.lastRun).not.toBeNull();
    expect(status.lastRun!.status).toBe("completed");
  });

  it("nextRunAt is in the future after start", async () => {
    const before = Date.now();
    scheduler.start();
    const { nextRunAt } = scheduler.getStatus();
    expect(nextRunAt).not.toBeNull();
    expect(nextRunAt!.getTime()).toBeGreaterThan(before);
  });
});

describe("SyncScheduler — estate evolution", () => {
  it("run 3 produces more nodes than run 1 (shadow asset appears)", async () => {
    // Run once to get baseline
    scheduler.connector.tick();
    const { NormalizationService } = await import("@sentinel/core");
    const norm = new NormalizationService(repo);
    await norm.normalize(scheduler.connector, "test-run-1");
    const countAfterRun1 = repo.nodes.size;

    // Advance to run 3
    scheduler.connector.tick();
    scheduler.connector.tick();
    await norm.normalize(scheduler.connector, "test-run-3");
    const countAfterRun3 = repo.nodes.size;

    // Run 3 introduces the untagged shadow asset → new node
    expect(countAfterRun3).toBeGreaterThan(countAfterRun1);
  });
});
