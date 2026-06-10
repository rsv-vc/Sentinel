/**
 * Server-side API helpers — Phase 8 fix.
 *
 * Next.js server components run on the server; the browser httpOnly cookie is
 * never forwarded automatically to the API.  This module reads the JWT from
 * next/headers and injects it as an Authorization: Bearer header so every
 * server-to-server fetch is authenticated.
 *
 * Usage: import from "@/lib/serverApi" in any async server component.
 *        Client components continue to use "@/lib/api" with credentials:"include".
 */

import { cookies } from "next/headers";
import type {
  GraphNodeDTO,
  CoverageReportDTO,
  EventDTO,
  SubgraphDTO,
  SyncStatusDTO,
  UseCaseRiskReportDTO,
  UseCaseComplianceReportDTO,
  PortfolioRiskReportDTO,
  BoardReportDTO,
  RectificationDTO,
} from "./api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function authHeader(): Promise<Record<string, string>> {
  try {
    const store = await cookies();
    const token = store.get("sentinel_token")?.value;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // cookies() throws outside request context (e.g. during build) — safe to ignore
  }
  return {};
}

async function serverFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = await authHeader();
  const res  = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...auth,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Server-side fetchers — mirrors of the client fetchers in api.ts
// ---------------------------------------------------------------------------

export const serverGetUseCases = () =>
  serverFetch<{ data: GraphNodeDTO[]; count: number }>("/api/use-cases");

export const serverGetNodes = (type?: string) =>
  serverFetch<{ data: GraphNodeDTO[]; count: number }>(
    `/api/nodes${type ? `?type=${type}` : ""}`,
  );

export const serverGetNode = (id: string) =>
  serverFetch<GraphNodeDTO>(`/api/nodes/${encodeURIComponent(id)}`);

export const serverGetSubgraph = (id: string) =>
  serverFetch<SubgraphDTO>(`/api/use-cases/${encodeURIComponent(id)}/graph`);

/** Graph for ANY node type — returns root + all connected neighbours + edges. */
export const serverGetNodeGraph = (id: string) =>
  serverFetch<SubgraphDTO>(`/api/nodes/${encodeURIComponent(id)}/graph`);

export const serverGetNodeHistory = (id: string) =>
  serverFetch<{ node: GraphNodeDTO; events: EventDTO[]; count: number }>(
    `/api/nodes/${encodeURIComponent(id)}/history`,
  );

export const serverGetCoverage = () =>
  serverFetch<CoverageReportDTO>("/api/coverage");

export const serverGetRecentEvents = (limit = 20) =>
  serverFetch<{ data: EventDTO[]; count: number }>(
    `/api/graph/recent-events?limit=${limit}`,
  );

export const serverGetSyncStatus = () =>
  serverFetch<SyncStatusDTO>("/api/sync/status");

export const serverGetUseCaseRisk = (id: string) =>
  serverFetch<UseCaseRiskReportDTO>(
    `/api/use-cases/${encodeURIComponent(id)}/risk`,
  );

export const serverGetUseCaseCompliance = (id: string) =>
  serverFetch<UseCaseComplianceReportDTO>(
    `/api/use-cases/${encodeURIComponent(id)}/compliance`,
  );

export const serverGetPortfolioRisk = () =>
  serverFetch<PortfolioRiskReportDTO>("/api/risk/portfolio");

export const serverGetBoardReport = () =>
  serverFetch<BoardReportDTO>("/api/reports/board");

export const serverListRectifications = (filters?: {
  nodeId?: string;
  status?: string;
  obligationId?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.nodeId)       params.set("nodeId",       filters.nodeId);
  if (filters?.status)       params.set("status",       filters.status);
  if (filters?.obligationId) params.set("obligationId", filters.obligationId);
  const qs = params.toString();
  return serverFetch<{ data: RectificationDTO[]; count: number }>(
    `/api/rectifications${qs ? `?${qs}` : ""}`,
  );
};
