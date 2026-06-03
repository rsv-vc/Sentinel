/**
 * PrismaGraphRepository — Postgres-backed implementation of IGraphRepository.
 *
 * Key invariants:
 *  - upsertNode writes a NODE_CREATED or NODE_UPDATED Event on every call.
 *  - Events are never deleted or modified; this file has no DELETE operations.
 *  - Low-confidence nodes write a NODE_FLAGGED_LOW_CONFIDENCE Event so reviewers
 *    can trace every ambiguous correlation back to its source signal.
 */

import { PrismaClient } from "@prisma/client";
import type {
  AppendEventInput,
  CreateEdgeInput,
  Event,
  GraphEdge,
  GraphNode,
  IGraphRepository,
  NodeWithEdges,
  UpsertNodeInput,
} from "./graph.repository.interface";
import { NodeType } from "@prisma/client";

export class PrismaGraphRepository implements IGraphRepository {
  constructor(private readonly db: PrismaClient) {}

  // ---------------------------------------------------------------------------
  // Nodes
  // ---------------------------------------------------------------------------

  async upsertNode(input: UpsertNodeInput): Promise<GraphNode> {
    const {
      id,
      type,
      label,
      attributes = {},
      confidence = "HIGH",
      source = "TELEMETRY",
      connectorId,
      actor = "system",
    } = input;

    const existing = await this.db.graphNode.findUnique({ where: { id } });

    const node = await this.db.graphNode.upsert({
      where: { id },
      create: { id, type, label, attributes, confidence, source, connectorId },
      update: { label, attributes, confidence, source, connectorId, updatedAt: new Date() },
    });

    // Append evidence event
    const eventType = existing ? "NODE_UPDATED" : "NODE_CREATED";
    await this.appendEvent({
      type: eventType,
      nodeId: id,
      payload: { label, attributes, confidence, source },
      actor,
      connectorId,
    });

    // Extra event for low-confidence — requires human confirmation
    if (confidence === "LOW" && (!existing || existing.confidence !== "LOW")) {
      await this.appendEvent({
        type: "NODE_FLAGGED_LOW_CONFIDENCE",
        nodeId: id,
        payload: { reason: "Ambiguous correlation — manual confirmation required" },
        actor,
        connectorId,
      });
    }

    return node;
  }

  async getNode(id: string): Promise<GraphNode | null> {
    return this.db.graphNode.findUnique({ where: { id } });
  }

  async listNodes(type?: NodeType): Promise<GraphNode[]> {
    return this.db.graphNode.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: "asc" },
    });
  }

  async getNodeWithEdges(id: string): Promise<NodeWithEdges | null> {
    return this.db.graphNode.findUnique({
      where: { id },
      include: { edgesFrom: true, edgesTo: true },
    });
  }

  // ---------------------------------------------------------------------------
  // Edges
  // ---------------------------------------------------------------------------

  async upsertEdge(input: CreateEdgeInput): Promise<GraphEdge> {
    const { type, fromId, toId, attributes = {} } = input;
    return this.db.graphEdge.upsert({
      where: { fromId_toId_type: { fromId, toId, type } },
      create: { type, fromId, toId, attributes },
      update: { attributes },
    });
  }

  async getEdgesByNode(nodeId: string): Promise<GraphEdge[]> {
    return this.db.graphEdge.findMany({
      where: { OR: [{ fromId: nodeId }, { toId: nodeId }] },
    });
  }

  // ---------------------------------------------------------------------------
  // Events (append-only — no update/delete methods exist here)
  // ---------------------------------------------------------------------------

  async appendEvent(input: AppendEventInput): Promise<Event> {
    return this.db.event.create({
      data: {
        type: input.type,
        nodeId: input.nodeId ?? null,
        payload: input.payload ?? {},
        actor: input.actor ?? "system",
        connectorId: input.connectorId ?? null,
      },
    });
  }

  async getNodeHistory(nodeId: string): Promise<Event[]> {
    return this.db.event.findMany({
      where: { nodeId },
      orderBy: { createdAt: "asc" },
    });
  }

  async listRecentEvents(limit = 50): Promise<Event[]> {
    return this.db.event.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
