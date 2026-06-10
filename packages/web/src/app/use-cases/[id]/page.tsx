import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { serverGetSubgraph as getSubgraph, serverGetNodeHistory as getNodeHistory, serverGetUseCaseRisk as getUseCaseRisk, serverGetUseCaseCompliance as getUseCaseCompliance, serverListRectifications as listRectifications } from "@/lib/serverApi";
import type { UseCaseRiskReportDTO, RiskLevel, GapStatus } from "@/lib/api";
import { Card, CardTitle } from "@/components/Card";
import { ConfidenceBadge, NodeTypeBadge, SourceBadge } from "@/components/Badge";
import { DependencyGraph } from "@/components/DependencyGraph";
import { ConfirmButton } from "@/components/ConfirmButton";
import { RectificationPanel } from "@/components/RectificationPanel";

export const metadata: Metadata = { title: "Use Case Detail" };

// ---------------------------------------------------------------------------
// Risk level colours
// ---------------------------------------------------------------------------

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW:         "text-[#9baf9c]",
  MEDIUM:      "text-[#d4a456]",
  HIGH:        "text-[#d4836e]",
  CRITICAL:    "text-[#C86F58]",
  UN_ASSESSED: "text-[#9a9078]",
};

const RISK_BG: Record<RiskLevel, string> = {
  LOW:         "bg-[#8A9C8B18] border-[#8A9C8B30]",
  MEDIUM:      "bg-[#C4924A18] border-[#C4924A30]",
  HIGH:        "bg-[#C86F5818] border-[#C86F5830]",
  CRITICAL:    "bg-[#C86F5828] border-[#C86F5845]",
  UN_ASSESSED: "bg-[#9a907818] border-[#9a907830]",
};

const GAP_COLOR: Record<GapStatus, string> = {
  GAP:       "text-[#d4836e]",
  PARTIAL:   "text-[#d4a456]",
  EVIDENCED: "text-[#9baf9c]",
};

const GAP_BG: Record<GapStatus, string> = {
  GAP:       "bg-[#C86F5818] border-[#C86F5830]",
  PARTIAL:   "bg-[#C4924A18] border-[#C4924A30]",
  EVIDENCED: "bg-[#8A9C8B18] border-[#8A9C8B30]",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RiskPill({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${RISK_BG[level]} ${RISK_COLOR[level]}`}>
      {level.replace("_", " ")}
    </span>
  );
}

function GapPill({ status }: { status: GapStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${GAP_BG[status]} ${GAP_COLOR[status]}`}>
      {status}
    </span>
  );
}

function RiskDimensionRow({
  label,
  dim,
}: {
  label: string;
  dim: UseCaseRiskReportDTO["dimensions"]["vendor"];
}) {
  return (
    <div className="border border-[#2a2825] rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#D9C8B4]">{label}</span>
        <RiskPill level={dim.level} />
      </div>
      <ul className="space-y-0.5">
        {dim.signals.map((s, i) => (
          <li key={i} className="text-xs text-[#9a9078] flex gap-2">
            <span className="text-[#5c5248] flex-shrink-0">·</span>
            {s}
          </li>
        ))}
      </ul>
      {dim.hints.length > 0 && (
        <details className="mt-1">
          <summary className="text-xs text-[#8A9C8B] cursor-pointer hover:text-[#9baf9c]">
            Remediation hints ({dim.hints.length})
          </summary>
          <ul className="mt-1 space-y-0.5 pl-3">
            {dim.hints.map((h, i) => (
              <li key={i} className="text-xs text-[#5c5248]">→ {h}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function UseCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const [subgraphResult, historyResult, riskResult, compResult, rectsResult] =
    await Promise.allSettled([
      getSubgraph(decodedId),
      getNodeHistory(decodedId),
      getUseCaseRisk(decodedId),
      getUseCaseCompliance(decodedId),
      listRectifications({ nodeId: decodedId }),
    ]);

  if (subgraphResult.status === "rejected") notFound();

  const subgraph    = subgraphResult.value;
  const history     = historyResult.status  === "fulfilled" ? historyResult.value  : null;
  const riskReport  = riskResult.status     === "fulfilled" ? riskResult.value     : null;
  const compReport  = compResult.status     === "fulfilled" ? compResult.value     : null;
  const rects       = rectsResult.status    === "fulfilled" ? rectsResult.value.data : [];
  const root        = subgraph.root;

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#5c5248]">
        <Link href="/use-cases" className="hover:text-[#9a9078] transition-colors">
          Use Cases
        </Link>
        <span>/</span>
        <span className="text-[#9a9078]">{root.label}</span>
      </div>

      {/* Title + badges */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#D9C8B4]">{root.label}</h1>
          <p className="text-xs text-[#5c5248] font-mono mt-1">{root.id}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <NodeTypeBadge type={root.type} />
          <ConfidenceBadge confidence={root.confidence} />
          <SourceBadge source={root.source} />
          {riskReport && <RiskPill level={riskReport.residualLevel} />}
          {root.confidence === "LOW" && !root.confirmed && (
            <ConfirmButton nodeId={root.id} />
          )}
        </div>
      </div>

      {/* Low-confidence warning */}
      {root.confidence === "LOW" && !root.confirmed && (
        <div className="flex gap-3 p-4 rounded-xl border border-[#C4924A44] bg-[#C4924A08]">
          <span className="text-[#d4a456] text-lg flex-shrink-0">⚠</span>
          <div>
            <p className="text-sm font-medium text-[#d4a456]">Awaiting confirmation</p>
            <p className="text-xs text-[#9a9078] mt-0.5">
              This use-case was inferred from connector data with low confidence.
              A human reviewer should confirm it represents a real, distinct use-case
              before it is treated as authoritative.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Risk report                                                          */}
      {/* ------------------------------------------------------------------ */}
      {riskReport ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Risk Assessment</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5c5248]">Residual</span>
              <RiskPill level={riskReport.residualLevel} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <RiskDimensionRow label="Vendor / Concentration"  dim={riskReport.dimensions.vendor} />
            <RiskDimensionRow label="Contractual / Identity"  dim={riskReport.dimensions.contractual} />
            <RiskDimensionRow label="Data / Residency"        dim={riskReport.dimensions.data} />
            <RiskDimensionRow label="Model Behaviour"         dim={riskReport.dimensions.modelBehaviour} />
            <RiskDimensionRow label="Resilience / Availability" dim={riskReport.dimensions.resilience} />
          </div>

          <p className="text-xs text-[#5c5248] mt-4">
            Generated {new Date(riskReport.generatedAt).toLocaleString()} · Signals derived from live graph evidence only. This is not a legal determination.
          </p>
        </Card>
      ) : (
        <Card>
          <CardTitle>Risk Assessment</CardTitle>
          <p className="text-sm text-[#5c5248]">Risk data unavailable — ensure the API is running and the graph is populated.</p>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Compliance obligations                                               */}
      {/* ------------------------------------------------------------------ */}
      {compReport ? (
        <Card>
          <div className="flex items-center justify-between mb-1">
            <CardTitle>Compliance Obligations</CardTitle>
            <div className="flex items-center gap-3 text-xs text-[#9a9078]">
              {compReport.jurisdictions.length > 0 && (
                <span>Jurisdictions: <span className="text-[#D9C8B4]">{compReport.jurisdictions.join(", ")}</span></span>
              )}
              <span>Obligations: <span className="text-[#D9C8B4]">{compReport.totalApplicable}</span></span>
              {compReport.totalGaps > 0 && (
                <span className="text-[#d4836e]">{compReport.totalGaps} gap{compReport.totalGaps > 1 ? "s" : ""}</span>
              )}
            </div>
          </div>

          {/* Context flags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {compReport.hasModelDeployment && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#8A9C8B18] text-[#9baf9c] border border-[#8A9C8B30]">Has model deployment</span>
            )}
            {compReport.hasPersonalData && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#C4924A18] text-[#d4a456] border border-[#C4924A30]">Processes personal data</span>
            )}
            {compReport.hasCrossBorderTransfer && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#C86F5818] text-[#d4836e] border border-[#C86F5830]">Cross-border transfer</span>
            )}
          </div>

          {compReport.applicableObligations.length === 0 ? (
            <p className="text-sm text-[#5c5248] py-4 text-center">
              No obligations triggered for this use-case based on current graph evidence.
            </p>
          ) : (
            <div className="space-y-3">
              {compReport.applicableObligations.map((o) => (
                <div key={o.obligation.id} className="border border-[#2a2825] rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <span className="text-sm font-semibold text-[#D9C8B4]">{o.obligation.title}</span>
                      <span className="text-xs text-[#5c5248] ml-2">{o.obligation.reference}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-[#5c5248]">{o.ruleSet.name} v{o.ruleSet.version}</span>
                      <GapPill status={o.gapStatus} />
                    </div>
                  </div>
                  <p className="text-xs text-[#9a9078] leading-relaxed">{o.obligation.description}</p>
                  {o.signals.length > 0 && (
                    <ul className="space-y-0.5">
                      {o.signals.map((s, i) => (
                        <li key={i} className="text-xs text-[#5c5248] flex gap-2">
                          <span className="flex-shrink-0">·</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Principle 5 disclaimer — always shown */}
          <div className="mt-4 p-3 rounded-lg border border-[#2a2825] bg-[#1e1c1a]">
            <p className="text-xs text-[#5c5248] leading-relaxed">
              <span className="text-[#9a9078] font-semibold">Disclaimer: </span>
              {compReport.disclaimer}
            </p>
          </div>

          <p className="text-xs text-[#5c5248] mt-2">
            Generated {new Date(compReport.generatedAt).toLocaleString()} · Rule-sets: GDPR v1.1.0 (eff. 2024-01-01), EU AI Act v1.0.0 (eff. 2025-08-01), DPDP v1.0.0 (eff. 2024-01-01)
          </p>
        </Card>
      ) : (
        <Card>
          <CardTitle>Compliance Obligations</CardTitle>
          <p className="text-sm text-[#5c5248]">Compliance data unavailable — ensure the API is running and the graph is populated.</p>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Rectifications                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardTitle>Rectifications</CardTitle>
        <RectificationPanel
          rectifications={rects.map((r) => ({ ...r, evidence: [] }))}
          nodeId={root.id}
          title=""
        />
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Dependency graph                                                     */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardTitle>Dependency Graph</CardTitle>
        {subgraph.neighbours.length === 0 ? (
          <p className="text-sm text-[#5c5248] py-4 text-center">
            No connected nodes yet. Run a sync to populate dependencies.
          </p>
        ) : (
          <DependencyGraph subgraph={subgraph} />
        )}
      </Card>

      {/* Neighbours table */}
      <Card>
        <CardTitle>Connected Nodes ({subgraph.neighbours.length})</CardTitle>
        {subgraph.neighbours.length === 0 ? (
          <p className="text-sm text-[#5c5248]">None</p>
        ) : (
          <div className="space-y-2">
            {subgraph.neighbours.map((n) => (
              <Link
                key={n.id}
                href={`/nodes/${encodeURIComponent(n.id)}`}
                className="flex items-center justify-between p-3 rounded-lg border border-[#2a2825] hover:border-[#8A9C8B44] hover:bg-[#1e2420] transition-all group"
              >
                <div>
                  <span className="text-sm font-medium text-[#D9C8B4] group-hover:text-[#9baf9c]">
                    {n.label}
                  </span>
                  <span className="text-xs text-[#5c5248] ml-2 font-mono">{n.id.slice(0, 20)}…</span>
                </div>
                <div className="flex gap-2">
                  <NodeTypeBadge type={n.type} />
                  <ConfidenceBadge confidence={n.confidence} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Event history */}
      {history && history.events.length > 0 && (
        <Card>
          <CardTitle>Event History ({history.count})</CardTitle>
          <div className="space-y-2">
            {history.events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 text-sm">
                <span className="text-[#5c5248] text-xs pt-0.5 flex-shrink-0 w-32">
                  {new Date(e.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="text-[#9baf9c] font-medium">{e.type.replace(/_/g, " ")}</span>
                <span className="text-[#5c5248] text-xs">by {e.actor}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
