/**
 * API client — thin fetch wrappers for server components and client components.
 * All functions accept an optional `signal` for cancellation.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include",   // send httpOnly cookie on cross-origin requests
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} → ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// Auth fetchers (Phase 8)
export interface AuthUserDTO {
  id:    string;
  email: string;
  name:  string;
  role:  "ADMIN" | "ANALYST" | "VIEWER";
}

export const loginUser = (email: string, password: string) =>
  apiFetch<{ ok: boolean; user: AuthUserDTO; token: string }>("/api/auth/login", {
    method: "POST",
    body:   JSON.stringify({ email, password }),
  });

// Logout hits the Next.js proxy route so it clears the same-origin cookie
export const logoutUser = () =>
  fetch("/api/auth/logout", { method: "POST" }).then((r) => r.json() as Promise<{ ok: boolean }>);

export const getMe = () =>
  apiFetch<{ user: { sub: string; email: string; name: string; role: string } }>("/api/auth/me");

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

export interface SyncStatusDTO {
  running: boolean;
  intervalMs: number;
  totalRuns: number;
  lastRun: {
    runNumber: number;
    startedAt: string;
    completedAt: string | null;
    status: "running" | "completed" | "skipped" | "error";
    result: { nodesUpserted: number; edgesUpserted: number; lowConfidenceNodes: string[] } | null;
    error: string | null;
  } | null;
  nextRunAt: string | null;
  connectors: Array<{
    id: string;
    name: string;
    status: string;
    lastSyncAt: string | null;
    currentRun: number;
  }>;
}

export const getSyncStatus = () =>
  apiFetch<SyncStatusDTO>("/api/sync/status", { cache: "no-store" });

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

// ---------------------------------------------------------------------------
// Risk & Compliance DTOs + fetchers (Phase 5)
// ---------------------------------------------------------------------------

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UN_ASSESSED";
export type GapStatus = "GAP" | "PARTIAL" | "EVIDENCED";

export interface RiskDimensionDTO {
  id: string;
  label: string;
  level: RiskLevel;
  signals: string[];
  hints: string[];
}

export interface UseCaseRiskReportDTO {
  useCaseId: string;
  useCaseLabel: string;
  residualLevel: RiskLevel;
  dimensions: {
    vendor: RiskDimensionDTO;
    contractual: RiskDimensionDTO;
    data: RiskDimensionDTO;
    modelBehaviour: RiskDimensionDTO;
    resilience: RiskDimensionDTO;
  };
  generatedAt: string;
}

export interface ObligationResultDTO {
  obligation: {
    id: string;
    title: string;
    description: string;
    reference: string;
    jurisdictions: string[];
  };
  ruleSet: { id: string; name: string; version: string; effectiveDate: string };
  gapStatus: GapStatus;
  signals: string[];
  effectiveDate: string;
}

export interface UseCaseComplianceReportDTO {
  useCaseId: string;
  useCaseLabel: string;
  jurisdictions: string[];
  hasCrossBorderTransfer: boolean;
  hasModelDeployment: boolean;
  hasPersonalData: boolean;
  applicableObligations: ObligationResultDTO[];
  totalApplicable: number;
  totalGaps: number;
  disclaimer: string;
  generatedAt: string;
}

export interface PortfolioRiskReportDTO {
  totalUseCases: number;
  highOrCritical: number;
  unassessed: number;
  byLevel: Record<string, number>;
  concentrationFlags: Array<{
    vendorId: string;
    vendorLabel: string;
    useCaseCount: number;
    portfolioShare: number;
  }>;
  generatedAt: string;
}

export const getUseCaseRisk = (id: string) =>
  apiFetch<UseCaseRiskReportDTO>(
    `/api/use-cases/${encodeURIComponent(id)}/risk`,
    { cache: "no-store" },
  );

export const getUseCaseCompliance = (id: string) =>
  apiFetch<UseCaseComplianceReportDTO>(
    `/api/use-cases/${encodeURIComponent(id)}/compliance`,
    { cache: "no-store" },
  );

export const getPortfolioRisk = () =>
  apiFetch<PortfolioRiskReportDTO>("/api/risk/portfolio", { cache: "no-store" });

// ---------------------------------------------------------------------------
// Board report (Phase 6)
// ---------------------------------------------------------------------------

export type RiskLevelKey = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UN_ASSESSED";

export interface BlindSpotDTO {
  kind: string;
  nodeId: string;
  label: string;
  description: string;
}

export interface BoardReportDTO {
  meta: {
    generatedAt: string;
    dataAsOf: string | null;
    totalSyncRuns: number;
    sentinelVersion: string;
  };
  coverage: {
    score: number;
    telemetryNodes: number;
    manualNodes: number;
    totalNodes: number;
    unconfirmedLowConfidence: number;
    blindSpots: BlindSpotDTO[];
    disclaimer: string;
  };
  risk: {
    totalUseCases: number;
    byLevel: Record<RiskLevelKey, number>;
    highOrCritical: number;
    unassessed: number;
    concentrationFlags: Array<{ vendorLabel: string; useCaseCount: number; portfolioShare: number }>;
    useCaseSummaries: Array<{
      id: string;
      label: string;
      residualLevel: RiskLevelKey;
      topSignals: string[];
      complianceGapCount: number;
      jurisdictions: string[];
    }>;
  };
  compliance: {
    totalObligationsTriggered: number;
    totalGaps: number;
    topGaps: Array<{
      obligationId: string;
      obligationTitle: string;
      reference: string;
      ruleSetName: string;
      ruleSetVersion: string;
      effectiveDate: string;
      affectedUseCaseCount: number;
      affectedUseCaseLabels: string[];
    }>;
    disclaimer: string;
  };
}

export const getBoardReport = () =>
  apiFetch<BoardReportDTO>("/api/reports/board", { cache: "no-store" });

// ---------------------------------------------------------------------------
// Rectification types + fetchers (Phase 7)
// ---------------------------------------------------------------------------

export type RectificationStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "WONT_FIX";
export type RectificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RectificationDTO {
  id: string;
  title: string;
  description: string;
  nodeId: string | null;
  obligationId: string | null;
  dimensionId: string | null;
  status: RectificationStatus;
  priority: RectificationPriority;
  actor: string;
  dueDate: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RectificationEvidenceDTO {
  id: string;
  rectificationId: string;
  content: string;
  actor: string;
  createdAt: string;
}

export interface RectificationWithEvidenceDTO extends RectificationDTO {
  evidence: RectificationEvidenceDTO[];
}

export const listRectifications = (filters?: { nodeId?: string; status?: string; obligationId?: string }) => {
  const params = new URLSearchParams();
  if (filters?.nodeId)       params.set("nodeId", filters.nodeId);
  if (filters?.status)       params.set("status", filters.status);
  if (filters?.obligationId) params.set("obligationId", filters.obligationId);
  const qs = params.toString();
  return apiFetch<{ data: RectificationDTO[]; count: number }>(
    `/api/rectifications${qs ? `?${qs}` : ""}`,
    { cache: "no-store" },
  );
};

export const getRectification = (id: string) =>
  apiFetch<RectificationWithEvidenceDTO>(`/api/rectifications/${id}`, { cache: "no-store" });

export const createRectification = (body: {
  title: string;
  description?: string;
  nodeId?: string;
  obligationId?: string;
  dimensionId?: string;
  priority?: RectificationPriority;
  dueDate?: string;
}) =>
  apiFetch<RectificationDTO>("/api/rectifications", { method: "POST", body: JSON.stringify(body) });

export const updateRectification = (id: string, body: {
  title?: string;
  description?: string;
  status?: RectificationStatus;
  priority?: RectificationPriority;
  dueDate?: string | null;
}) =>
  apiFetch<RectificationDTO>(`/api/rectifications/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const resolveRectification = (id: string, actor = "user") =>
  apiFetch<RectificationDTO>(`/api/rectifications/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({ actor }),
  });

export const fileEvidence = (rectificationId: string, content: string, actor = "user") =>
  apiFetch<RectificationEvidenceDTO>(`/api/rectifications/${rectificationId}/evidence`, {
    method: "POST",
    body: JSON.stringify({ content, actor }),
  });
