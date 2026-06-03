/**
 * NormalizationService tests — use an in-memory IGraphRepository stub
 * so no database is required. The stub records every call, letting us
 * assert graph structure and Event invariants without Postgres.
 */

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
// In-memory repository stub
// ---------------------------------------------------------------------------

class InMemoryGraphRepository implements IGraphRepository {
  nodes = new Map<string, GraphNode>();
  edges = new Map<string, GraphEdge>();
  events: Event[] = [];

  private edgeKey(fromId: string, toId: string, type: string) {
    return `${fromId}||${toId}||${type}`;
  }

  async upsertNode(input: UpsertNodeInput): Promise<GraphNode> {
    const existing = this.nodes.get(input.id);
    const now = new Date();
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

    // Append event (mirrors PrismaGraphRepository behaviour)
    const eventType = existing ? "NODE_UPDATED" : "NODE_CREATED";
    await this.appendEvent({ type: eventType, nodeId: input.id, actor: input.actor });
    if (input.confidence === "LOW" && (!existing || existing.confidence !== "LOW")) {
      await this.appendEvent({ type: "NODE_FLAGGED_LOW_CONFIDENCE", nodeId: input.id });
    }
    return node;
  }

  async getNode(id: string): Promise<GraphNode | null> {
    return this.nodes.get(id) ?? null;
  }

  async listNodes(type?: NodeType): Promise<GraphNode[]> {
    const all = Array.from(this.nodes.values());
    return type ? all.filter((n) => n.type === type) : all;
  }

  async getNodeWithEdges(id: string): Promise<NodeWithEdges | null> {
    const node = this.nodes.get(id);
    if (!node) return null;
    const allEdges = Array.from(this.edges.values());
    return {
      ...node,
      edgesFrom: allEdges.filter((e) => e.fromId === id),
      edgesTo: allEdges.filter((e) => e.toId === id),
    };
  }

  async upsertEdge(input: CreateEdgeInput): Promise<GraphEdge> {
    const key = this.edgeKey(input.fromId, input.toId, input.type);
    const edge: GraphEdge = {
      id: key,
      type: input.type,
      fromId: input.fromId,
      toId: input.toId,
      attributes: (input.attributes ?? {}) as object & Record<string, unknown>,
      createdAt: new Date(),
    };
    this.edges.set(key, edge);
    return edge;
  }

  async getEdgesByNode(nodeId: string): Promise<GraphEdge[]> {
    return Array.from(this.edges.values()).filter(
      (e) => e.fromId === nodeId || e.toId === nodeId,
    );
  }

  async appendEvent(input: AppendEventInput): Promise<Event> {
    const event: Event = {
      id: `evt-${this.events.length + 1}`,
      type: input.type,
      nodeId: input.nodeId ?? null,
      payload: (input.payload ?? {}) as object & Record<string, unknown>,
      actor: input.actor ?? "system",
      connectorId: input.connectorId ?? null,
      createdAt: new Date(),
    };
    this.events.push(event);
    return event;
  }

  async getNodeHistory(nodeId: string): Promise<Event[]> {
    return this.events.filter((e) => e.nodeId === nodeId);
  }

  async listRecentEvents(limit = 50): Promise<Event[]> {
    return this.events.slice(-limit).reverse();
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let repo: InMemoryGraphRepository;
let service: NormalizationService;
let connector: MockCloudConnector;

beforeEach(() => {
  repo = new InMemoryGraphRepository();
  service = new NormalizationService(repo);
  connector = new MockCloudConnector();
});

describe("NormalizationService — node creation", () => {
  it("creates nodes for all asset types", async () => {
    await service.normalize(connector);
    const assetNodes = await repo.listNodes("ASSET");
    // 5 assets + 2 model deployments = 7 ASSET-type nodes
    expect(assetNodes.length).toBe(7);
  });

  it("creates vendor nodes for each distinct vendor/provider", async () => {
    await service.normalize(connector);
    const vendors = await repo.listNodes("VENDOR");
    const labels = vendors.map((v) => v.label);
    expect(labels).toContain("aws");
    expect(labels).toContain("openai");
    expect(labels).toContain("anthropic");
  });

  it("creates jurisdiction nodes for observed regions", async () => {
    await service.normalize(connector);
    const jurisdictions = await repo.listNodes("JURISDICTION");
    const ids = jurisdictions.map((j) => j.id);
    expect(ids).toContain("jurisdiction::US");
    expect(ids).toContain("jurisdiction::EU");
  });

  it("creates use-case nodes inferred from model labels and asset tags", async () => {
    await service.normalize(connector);
    const useCases = await repo.listNodes("USE_CASE");
    const labels = useCases.map((u) => u.label);
    expect(labels).toContain("fraud-detection");
    expect(labels).toContain("customer-churn");
  });

  it("creates data-asset nodes for storage assets", async () => {
    await service.normalize(connector);
    const dataAssets = await repo.listNodes("DATA_ASSET");
    expect(dataAssets.length).toBe(2); // 2 S3 buckets
  });
});

describe("NormalizationService — edges", () => {
  it("every asset node has an OWNED_BY_VENDOR edge", async () => {
    await service.normalize(connector);
    const ownedByEdges = Array.from(repo.edges.values()).filter(
      (e) => e.type === "OWNED_BY_VENDOR",
    );
    // 5 assets + 2 models = 7
    expect(ownedByEdges.length).toBe(7);
  });

  it("USES_MODEL edges link use-cases to model nodes", async () => {
    await service.normalize(connector);
    const usesModelEdges = Array.from(repo.edges.values()).filter(
      (e) => e.type === "USES_MODEL",
    );
    expect(usesModelEdges.length).toBeGreaterThan(0);
  });

  it("USES_ASSET edges exist for assets with a project tag", async () => {
    await service.normalize(connector);
    const usesAssetEdges = Array.from(repo.edges.values()).filter(
      (e) => e.type === "USES_ASSET",
    );
    expect(usesAssetEdges.length).toBeGreaterThan(0);
  });

  it("SUBJECT_TO edges connect nodes to jurisdictions", async () => {
    await service.normalize(connector);
    const subjectToEdges = Array.from(repo.edges.values()).filter(
      (e) => e.type === "SUBJECT_TO",
    );
    expect(subjectToEdges.length).toBeGreaterThan(0);
  });
});

describe("NormalizationService — determinism", () => {
  it("running normalize twice produces the same node ids (idempotent upserts)", async () => {
    await service.normalize(connector);
    const firstIds = new Set(repo.nodes.keys());

    await service.normalize(connector);
    const secondIds = new Set(repo.nodes.keys());

    expect([...firstIds].sort()).toEqual([...secondIds].sort());
  });

  it("running normalize twice does NOT double-count edges", async () => {
    await service.normalize(connector);
    const countAfterFirst = repo.edges.size;
    await service.normalize(connector);
    expect(repo.edges.size).toBe(countAfterFirst);
  });
});

describe("NormalizationService — Event append-only invariant", () => {
  it("writes at least one event per node upserted", async () => {
    await service.normalize(connector);
    const nodeCount = repo.nodes.size;
    const nodeEvents = repo.events.filter(
      (e) => e.type === "NODE_CREATED" || e.type === "NODE_UPDATED",
    );
    expect(nodeEvents.length).toBeGreaterThanOrEqual(nodeCount);
  });

  it("writes a SYNC_COMPLETED event at the end of each run", async () => {
    await service.normalize(connector);
    const syncEvents = repo.events.filter((e) => e.type === "SYNC_COMPLETED");
    expect(syncEvents.length).toBe(1);
  });

  it("writes SYNC_COMPLETED event for every sync run (two runs = two events)", async () => {
    await service.normalize(connector);
    await service.normalize(connector);
    const syncEvents = repo.events.filter((e) => e.type === "SYNC_COMPLETED");
    expect(syncEvents.length).toBe(2);
  });

  it("events are never removed — count only ever grows", async () => {
    await service.normalize(connector);
    const countAfterFirst = repo.events.length;
    expect(countAfterFirst).toBeGreaterThan(0);
    await service.normalize(connector);
    expect(repo.events.length).toBeGreaterThan(countAfterFirst);
  });
});

describe("NormalizationService — low-confidence flagging (Principle 3)", () => {
  it("flags NODE_FLAGGED_LOW_CONFIDENCE for untagged assets", async () => {
    // Inject an untagged asset via a custom mini-connector
    const sparseConnector = {
      id: "sparse-connector",
      name: "Sparse",
      listAssets: async () => [
        {
          id: "untagged-asset-001",
          kind: "COMPUTE_INSTANCE" as const,
          name: "mystery-box",
          vendor: "aws",
          region: "us-east-1" as const,
          monthlyCost: { amount: 100, currency: "USD" as const },
          tags: {},
          observedAt: new Date(),
        },
      ],
      listModelDeployments: async () => [],
      listIdentityGrants: async () => [],
      listEgressEvents: async () => [],
    };

    await service.normalize(sparseConnector);
    const lowConfEvents = repo.events.filter(
      (e) => e.type === "NODE_FLAGGED_LOW_CONFIDENCE",
    );
    expect(lowConfEvents.length).toBeGreaterThanOrEqual(1);
  });
});

describe("NormalizationService — result summary", () => {
  it("returns a result with nodesUpserted > 0", async () => {
    const result = await service.normalize(connector);
    expect(result.nodesUpserted).toBeGreaterThan(0);
    expect(result.edgesUpserted).toBeGreaterThan(0);
    expect(result.connectorId).toBe(connector.id);
  });
});
