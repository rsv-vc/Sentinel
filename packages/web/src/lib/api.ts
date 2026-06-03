/**
 * API client — thin fetch wrappers for server components and client components.
 * All functions accept an optional `signal` for cancellation.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types (subset of API responses for the frontend)
// ---------------------------------------------------------------------------

export interface GraphNodeDTO {
  id: string;
  type: "USE_CASE" | "ASSET" | "VENDOR" | "DATA_ASSET" | "JURISDICTION";
  label: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  source: "TELEMETRY" | "MANUAL";
  confirmed: boolean;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GraphEdgeDTO {
  id: string;
  type: string;
  fromId: string;
  toId: string;
}

export interface CoverageReportDTO {
  coverageScore: number;
  telemetryNodes: number;
  manualNodes: number;
  totalNodes: number;
  unconfirmedLowConfidence: number;
  blindSpots: Array<{ kind: string; nodeId: string; label: string; description: string }>;
  disclaimer: string;
  computedAt: string;
}

export interface EventDTO {
  id: string;
  type: string;
  nodeId: string | null;
  actor: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface SubgraphDTO {
  root: GraphNodeDTO & { edgesFrom: GraphEdgeDTO[]; edgesTo: GraphEdgeDTO[] };
  neighbours: GraphNodeDTO[];
  edges: GraphEdgeDTO[];
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export const getUseCases = () =>
  apiFetch<{ data: GraphNodeDTO[]; count: number }>("/api/use-cases", { cache: "no-store" });

export const getNodes = (type?: string) =>
  apiFetch<{ data: GraphNodeDTO[]; count: number }>(
    `/api/nodes${type ? `?type=${type}` : ""}`,
    { cache: "no-store" },
  );

export const getNode = (id: string) =>
  apiFetch<GraphNodeDTO>(`/api/nodes/${encodeURIComponent(id)}`, { cache: "no-store" });

export const getSubgraph = (id: string) =>
  apiFetch<SubgraphDTO>(`/api/use-cases/${encodeURIComponent(id)}/graph`, { cache: "no-store" });

export const getNodeHistory = (id: string) =>
  apiFetch<{ node: GraphNodeDTO; events: EventDTO[]; count: number }>(
    `/api/nodes/${encodeURIComponent(id)}/history`,
    { cache: "no-store" },
  );

export const getCoverage = () =>
  apiFetch<CoverageReportDTO>("/api/coverage", { cache: "no-store" });

export const getRecentEvents = (limit = 20) =>
  apiFetch<{ data: EventDTO[]; count: number }>(
    `/api/graph/recent-events?limit=${limit}`,
    { cache: "no-store" },
  );

export const triggerSync = () =>
  apiFetch<{ ok: boolean; result: unknown }>("/api/sync", { method: "POST" });

export const confirmNode = (id: string, actor = "user") =>
  apiFetch<{ ok: boolean; node: GraphNodeDTO }>(
    `/api/nodes/${encodeURIComponent(id)}/confirm`,
    { method: "POST", body: JSON.stringify({ actor }) },
  );

export const createNode = (body: { type: string; label: string; attributes?: Record<string, unknown> }) =>
  apiFetch<GraphNodeDTO>("/api/nodes", { method: "POST", body: JSON.stringify(body) });

export const annotateNode = (id: string, body: { label?: string; attributes?: Record<string, unknown> }) =>
  apiFetch<GraphNodeDTO>(`/api/nodes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
