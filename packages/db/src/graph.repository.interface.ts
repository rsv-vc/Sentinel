/**
 * IGraphRepository — abstracts graph persistence so the backing store
 * (Postgres today, Neo4j later) can be swapped without touching core or api.
 *
 * All mutation methods append Events; they never hard-delete or overwrite rows.
 */

import type {
  ConfidenceLevel,
  DataSource,
  EdgeType,
  Event,
  EventType,
  GraphEdge,
  GraphNode,
  NodeType,
} from "@prisma/client";

export type { ConfidenceLevel, DataSource, EdgeType, EventType, NodeType };

// ---------------------------------------------------------------------------
// Input shapes
// ---------------------------------------------------------------------------

export interface CreateNodeInput {
  id: string;
  type: NodeType;
  label: string;
  attributes?: Record<string, unknown>;
  confidence?: ConfidenceLevel;
  source?: DataSource;
  connectorId?: string;
}

export interface UpsertNodeInput extends CreateNodeInput {
  /** Actor that triggered this change — connector id, user id, or "system" */
  actor?: string;
}

export interface CreateEdgeInput {
  type: EdgeType;
  fromId: string;
  toId: string;
  attributes?: Record<string, unknown>;
}

export interface AppendEventInput {
  type: EventType;
  nodeId?: string;
  payload?: Record<string, unknown>;
  actor?: string;
  connectorId?: string;
}

// ---------------------------------------------------------------------------
// Output shapes (re-export Prisma types for consumers)
// ---------------------------------------------------------------------------

export type { Event, GraphEdge, GraphNode };

export interface NodeWithEdges extends GraphNode {
  edgesFrom: GraphEdge[];
  edgesTo: GraphEdge[];
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IGraphRepository {
  // Nodes
  upsertNode(input: UpsertNodeInput): Promise<GraphNode>;
  getNode(id: string): Promise<GraphNode | null>;
  listNodes(type?: NodeType): Promise<GraphNode[]>;
  getNodeWithEdges(id: string): Promise<NodeWithEdges | null>;

  // Edges
  upsertEdge(input: CreateEdgeInput): Promise<GraphEdge>;
  getEdgesByNode(nodeId: string): Promise<GraphEdge[]>;

  // Events (append-only)
  appendEvent(input: AppendEventInput): Promise<Event>;
  getNodeHistory(nodeId: string): Promise<Event[]>;
  listRecentEvents(limit?: number): Promise<Event[]>;
}
