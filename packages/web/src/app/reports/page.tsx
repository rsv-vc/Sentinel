import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import type { RiskLevelKey } from "@/lib/api";
import { Card, CardTitle } from "@/components/Card";

export const metadata: Metadata = { title: "Board Report" };

// Mock board report data
const mockReport = {
  meta: {
    generatedAt: new Date().toISOString(),
    dataAsOf: new Date().toISOString(),
    totalSyncRuns: 147,
    sentinelVersion: "2.4.1",
  },
  coverage: {
    score: 62,
    totalNodes: 94,
    telemetryNodes: 94,
    manualNodes: 0,
    unconfirmedLowConfidence: 4,
    disclaimer: "Coverage score reflects nodes confirmed via telemetry or manual review. Unconfirmed low-confidence nodes are excluded from risk scoring until reviewed.",
    blindSpots: [
      { nodeId: "bs-1", kind: "HARDWARE",    label: "GPU Cluster Config",        description: "No telemetry — inferred from billing data only" },
      { nodeId: "bs-2", kind: "MODEL",       label: "Anthropic Model Versions",  description: "Version pinning not detected in API calls" },
      { nodeId: "bs-3", kind: "PIPELINE",    label: "Data Pipeline Logs",        description: "ETL ingestion paths not mapped" },
      { nodeId: "bs-4", kind: "INTEGRATION", label: "Slack AI Integration",      description: "OAuth scope broader than required" },
    ],
  },
  risk: {
    totalUseCases: 12,
    highOrCritical: 2,
    unassessed: 4,
    concentrationFlags: [
      { vendorLabel: "Anthropic", portfolioShare: 42, useCaseCount: 5 },
      { vendorLabel: "OpenAI",    portfolioShare: 33, useCaseCount: 4 },
    ],
    useCaseSummaries: [
      { id: "uc-1", label: "Knowledge Management Assistant", residualLevel: "MEDIUM"      as RiskLevelKey, jurisdictions: ["US", "EU"], topSignals: ["No vendor failover defined"],        complianceGapCount: 1 },
      { id: "uc-2", label: "Document Creation Copilot",      residualLevel: "LOW"         as RiskLevelKey, jurisdictions: ["US"],       topSignals: ["Monitoring in place"],               complianceGapCount: 0 },
      { id: "uc-3", label: "Customer Support Triage",        residualLevel: "HIGH"        as RiskLevelKey, jurisdictions: ["US","EU","APAC"], topSignals: ["Cross-border data egress"],   complianceGapCount: 3 },
      { id: "uc-4", label: "Code Review Assistant",          residualLevel: "LOW"         as RiskLevelKey, jurisdictions: ["US"],       topSignals: ["Low risk profile"],                  complianceGapCount: 0 },
      { id: "uc-5", label: "Financial Forecasting Model",    residualLevel: "HIGH"        as RiskLevelKey, jurisdictions: ["US"],       topSignals: ["No FRIA completed"],                 complianceGapCount: 2 },
      { id: "uc-6", label: "HR Policy Chatbot",              residualLevel: "MEDIUM"      as RiskLevelKey, jurisdictions: ["US","EU"],  topSignals: ["Personal data in scope"],            complianceGapCount: 1 },
      { id: "uc-7", label: "Workflow Automation",            residualLevel: "UN_ASSESSED" as RiskLevelKey, jurisdictions: ["EU"],       topSignals: ["Pending assessment"],                complianceGapCount: 0 },
      { id: "uc-8", label: "Data Pipeline Intelligence",     residualLevel: "UN_ASSESSED" as RiskLevelKey, jurisdictions: ["US"],       topSignals: ["Pending assessment"],                complianceGapCount: 0 },
    ],
  },
  compliance: {
    totalObligationsTriggered: 18,
    totalGaps: 7,
    disclaimer: "This compliance assessment is automated and based solely on graph evidence. It does not constitute legal advice. Obligations are derived from GDPR v1.1.0, EU AI Act v1.0.0, and DPDP v1.0.0. Consult qualified legal counsel before relying on this report.",
    topGaps: [
      { obligationId: "gdpr-22", obligationTitle: "Automated Decision-Making Rights", reference: "GDPR Art. 22", ruleSetName: "GDPR", ruleSetVersion: "1.1.0", effectiveDate: "2024-01-01", affectedUseCaseCount: 3, affectedUseCaseLabels: ["Customer Support Triage", "Financial Forecasting Model", "HR Policy Chatbot"] },
      { obligationId: "eu-ai-9", obligationTitle: "Fundamental Rights Impact Assessment", reference: "EU AI Act Art. 9", ruleSetName: "EU AI Act", ruleSetVersion: "1.0.0", effectiveDate: "2025-08-01", affectedUseCaseCount: 2, affectedUseCaseLabels: ["Customer Support Triage", "Financial Forecasting Model"] },
      { obligationId: "gdpr-46", obligationTitle: "Cross-Border Transfer Safeguards", reference: "GDPR Art. 46", ruleSetName: "GDPR", ruleSetVersion: "1.1.0", effectiveDate: "2024-01-01", affectedUseCaseCount: 2, affectedUseCaseLabels: ["Customer Support Triage", "Knowledge Management Assistant"] },
    ],
  },
};

const RISK_COLOR: Record<RiskLevelKey, string> = {
  LOW:         "text-[#9baf9c]",
  MEDIUM:      "text-[#d4a456]",
  HIGH:        "text-[#d4836e]",
  CRITICAL:    "text-[#C86F58]",
  UN_ASSESSED: "text-[#9a9078]",
};

const RISK_BG: Record<RiskLevelKey, string> = {
  LOW:         "bg-[#8A9C8B18] border-[#8A9C8B30]",
  MEDIUM:      "bg-[#C4924A18] border-[#C4924A30]",
  HIGH:        "bg-[#C86F5818] border-[#C86F5830]",
  CRITICAL:    "bg-[#C86F5828] border-[#C86F5845]",
  UN_ASSESSED: "bg-[#9a907818] border-[#9a907830]",
};

function RiskPill({ level }: { level: RiskLevelKey }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${RISK_BG[level]} ${RISK_COLOR[level]}`}>
      {level.replace("_", " ")}
    </span>
  );
}

function scoreColor(score: number) {
  if (score >= 80) return "text-[#9baf9c]";
  if (score >= 50) return "text-[#d4a456]";
  return "text-[#d4836e]";
}

function DownloadButton({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#8A9C8B] hover:bg-[#7a8c7b] text-[#1a1918] transition-colors"
    >
      <span>{icon}</span>
      {label}
    </a>
  );
}

export default function ReportsPage() {
  const report = mockReport;
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  return (
    <div className="space-y-6">

      <PageHeader
        title="Board Report"
        subtitle="AI risk summary for executive and board distribution — coverage score and blind spots always included"
        actions={
          <>
            <DownloadButton href={`${API}/api/reports/board.csv`} label="CSV" icon="⬇" />
            <DownloadButton href={`${API}/api/reports/board.pdf`} label="PDF" icon="⬇" />
          </>
        }
      />

      <>
          {/* Meta row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <p className="text-xs text-[#5c5248] uppercase tracking-wide mb-1">Generated</p>
              <p className="text-sm font-semibold text-[#D9C8B4]">
                {new Date(report.meta.generatedAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-[#5c5248] uppercase tracking-wide mb-1">Data as of</p>
              <p className="text-sm font-semibold text-[#D9C8B4]">
                {report.meta.dataAsOf
                  ? new Date(report.meta.dataAsOf).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
                  : "—"}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-[#5c5248] uppercase tracking-wide mb-1">Sync Runs</p>
              <p className="text-3xl font-black text-[#D9C8B4]">{report.meta.totalSyncRuns}</p>
            </Card>
            <Card>
              <p className="text-xs text-[#5c5248] uppercase tracking-wide mb-1">Sentinel v</p>
              <p className="text-sm font-semibold text-[#9baf9c]">{report.meta.sentinelVersion}</p>
            </Card>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Section 1 — Coverage                                              */}
          {/* ---------------------------------------------------------------- */}
          <Card>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <CardTitle>1 · Coverage</CardTitle>
              <span className={`text-4xl font-black ${scoreColor(report.coverage.score)}`}>
                {report.coverage.score}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
              {[
                { label: "Total nodes",    value: report.coverage.totalNodes },
                { label: "Telemetry",      value: report.coverage.telemetryNodes },
                { label: "Manual",         value: report.coverage.manualNodes },
                { label: "Unconfirmed",    value: report.coverage.unconfirmedLowConfidence },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-lg border border-[#2a2825] bg-[#1e1c1a]">
                  <p className="text-xs text-[#5c5248] mb-1">{label}</p>
                  <p className="text-xl font-black text-[#D9C8B4]">{value}</p>
                </div>
              ))}
            </div>

            {report.coverage.blindSpots.length > 0 ? (
              <>
                <p className="text-sm font-semibold text-[#d4836e] mb-2">
                  Blind spots ({report.coverage.blindSpots.length})
                </p>
                <div className="space-y-1">
                  {report.coverage.blindSpots.slice(0, 10).map((bs) => (
                    <div key={bs.nodeId} className="flex items-start gap-2 text-xs">
                      <span className="text-[#d4a456] flex-shrink-0">⚠</span>
                      <span className="text-[#5c5248] flex-shrink-0 w-40">{bs.kind}</span>
                      <span className="text-[#9a9078]">{bs.label}</span>
                      <span className="text-[#5c5248] ml-auto flex-shrink-0">{bs.description}</span>
                    </div>
                  ))}
                  {report.coverage.blindSpots.length > 10 && (
                    <p className="text-xs text-[#5c5248]">… and {report.coverage.blindSpots.length - 10} more in the CSV/PDF export.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-[#9baf9c]">No blind spots detected in current graph.</p>
            )}

            {/* Coverage disclaimer — Principle 3 */}
            <div className="mt-4 p-3 rounded-lg border border-[#2a2825] bg-[#1e1c1a]">
              <p className="text-xs text-[#5c5248]">
                <span className="text-[#9a9078] font-semibold">Coverage note: </span>
                {report.coverage.disclaimer}
              </p>
            </div>
          </Card>

          {/* ---------------------------------------------------------------- */}
          {/* Section 2 — Risk Summary                                          */}
          {/* ---------------------------------------------------------------- */}
          <Card>
            <CardTitle>2 · Risk Summary</CardTitle>

            {/* KPI row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-lg border border-[#2a2825] bg-[#1e1c1a]">
                <p className="text-xs text-[#5c5248] mb-1">Use-cases</p>
                <p className="text-3xl font-black text-[#D9C8B4]">{report.risk.totalUseCases}</p>
              </div>
              <div className="p-3 rounded-lg border border-[#C86F5818] bg-[#1e1c1a]">
                <p className="text-xs text-[#5c5248] mb-1">High / Critical</p>
                <p className={`text-3xl font-black ${report.risk.highOrCritical > 0 ? "text-[#d4836e]" : "text-[#9baf9c]"}`}>
                  {report.risk.highOrCritical}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-[#C4924A18] bg-[#1e1c1a]">
                <p className="text-xs text-[#5c5248] mb-1">UN_ASSESSED</p>
                <p className={`text-3xl font-black ${report.risk.unassessed > 0 ? "text-[#d4a456]" : "text-[#D9C8B4]"}`}>
                  {report.risk.unassessed}
                </p>
              </div>
            </div>

            {/* Concentration flags */}
            {report.risk.concentrationFlags.length > 0 && (
              <div className="mb-4 p-3 rounded-lg border border-[#C4924A44] bg-[#C4924A08]">
                <p className="text-sm font-semibold text-[#d4a456] mb-2">⚠ Vendor concentration</p>
                {report.risk.concentrationFlags.map((f) => (
                  <p key={f.vendorLabel} className="text-xs text-[#9a9078]">
                    <span className="text-[#D9C8B4] font-semibold">{f.vendorLabel}</span>
                    {" "}appears in {f.portfolioShare}% of use-cases ({f.useCaseCount})
                  </p>
                ))}
              </div>
            )}

            {/* Use-case table */}
            <div className="space-y-2">
              {report.risk.useCaseSummaries.map((uc) => (
                <div key={uc.id} className="flex items-start justify-between p-3 rounded-lg border border-[#2a2825] gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#D9C8B4]">{uc.label}</p>
                    {uc.jurisdictions.length > 0 && (
                      <p className="text-xs text-[#5c5248]">Jurisdictions: {uc.jurisdictions.join(", ")}</p>
                    )}
                    {uc.topSignals[0] && (
                      <p className="text-xs text-[#5c5248] mt-0.5 truncate">· {uc.topSignals[0]}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {uc.complianceGapCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#C86F5818] text-[#d4836e] border border-[#C86F5830]">
                        {uc.complianceGapCount} gap{uc.complianceGapCount > 1 ? "s" : ""}
                      </span>
                    )}
                    <RiskPill level={uc.residualLevel} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ---------------------------------------------------------------- */}
          {/* Section 3 — Compliance                                            */}
          {/* ---------------------------------------------------------------- */}
          <Card>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <CardTitle>3 · Compliance Obligations & Gaps</CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#9a9078]">
                  Obligations triggered: <span className="text-[#D9C8B4] font-semibold">{report.compliance.totalObligationsTriggered}</span>
                </span>
                <span className={report.compliance.totalGaps > 0 ? "text-[#d4836e] font-semibold" : "text-[#9baf9c]"}>
                  Gaps: {report.compliance.totalGaps}
                </span>
              </div>
            </div>

            {/* Compliance disclaimer — Principle 5, always first */}
            <div className="mb-4 p-3 rounded-lg border border-[#2a2825] bg-[#1e1c1a]">
              <p className="text-xs text-[#5c5248]">
                <span className="text-[#9a9078] font-semibold">Disclaimer: </span>
                {report.compliance.disclaimer}
              </p>
            </div>

            {report.compliance.topGaps.length === 0 ? (
              <p className="text-sm text-[#9baf9c]">No compliance gaps identified based on current graph evidence.</p>
            ) : (
              <div className="space-y-3">
                {report.compliance.topGaps.map((gap) => (
                  <div key={gap.obligationId} className="border border-[#2a2825] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                      <div>
                        <p className="text-sm font-semibold text-[#d4836e]">{gap.obligationTitle}</p>
                        <p className="text-xs text-[#5c5248]">{gap.reference} · {gap.ruleSetName} v{gap.ruleSetVersion} · eff. {gap.effectiveDate}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#C86F5818] text-[#d4836e] border border-[#C86F5830] flex-shrink-0">
                        {gap.affectedUseCaseCount} use-case{gap.affectedUseCaseCount > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-[#9a9078]">
                      Affected: {gap.affectedUseCaseLabels.slice(0, 3).join(", ")}
                      {gap.affectedUseCaseLabels.length > 3 && ` +${gap.affectedUseCaseLabels.length - 3} more`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ---------------------------------------------------------------- */}
          {/* Section 4 — Financial Overview                                   */}
          {/* ---------------------------------------------------------------- */}
          <Card>
            <CardTitle>4 · Financial Overview & Cost Optimization</CardTitle>

            {/* Finance KPI Row */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-4">
              <div className="p-3 rounded-lg border border-[#2a2825] bg-[#1e1c1a]">
                <p className="text-xs text-[#5c5248] mb-1">Monthly Spend</p>
                <p className="text-2xl font-black text-[#D9C8B4]">$16,197</p>
                <p className="text-xs text-[#5c5248] mt-1">+1.2% MoM</p>
              </div>
              <div className="p-3 rounded-lg border border-[#2a2825] bg-[#1e1c1a]">
                <p className="text-xs text-[#5c5248] mb-1">Annual Run-Rate</p>
                <p className="text-2xl font-black text-[#D9C8B4]">$194,364</p>
                <p className="text-xs text-[#9baf9c] mt-1">12 Active Tools</p>
              </div>
              <div className="p-3 rounded-lg border border-[#9baf9c30] bg-[#1e2420]">
                <p className="text-xs text-[#5c5248] mb-1">Savings Potential</p>
                <p className="text-2xl font-black text-[#9baf9c]">$4,800/yr</p>
                <p className="text-xs text-[#5c5248] mt-1">8% reduction</p>
              </div>
              <div className="p-3 rounded-lg border border-[#2a2825] bg-[#1e1c1a]">
                <p className="text-xs text-[#5c5248] mb-1">Active Vendors</p>
                <p className="text-2xl font-black text-[#D9C8B4]">5</p>
                <p className="text-xs text-[#d4a456] mt-1">42% concentration</p>
              </div>
            </div>

            {/* Spend by Category */}
            <p className="text-sm font-semibold text-[#D9C8B4] mb-3">Monthly Spend by Category</p>
            <div className="space-y-2 mb-4">
              {[
                { label: "Software/LLMs", amount: 7900, pct: 49, color: "bg-[#8A9C8B]" },
                { label: "GPU Compute", amount: 13700, pct: 84, color: "bg-[#d4836e]" },
                { label: "Training", amount: 2000, pct: 12, color: "bg-[#C4924A]" },
                { label: "Infrastructure", amount: 2600, pct: 16, color: "bg-[#9a9078]" },
              ].map((cat) => (
                <div key={cat.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#D9C8B4] font-medium">{cat.label}</span>
                    <span className="text-xs font-bold text-[#9a9078]">${cat.amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-[#242220] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${cat.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Optimization Opportunities */}
            <p className="text-sm font-semibold text-[#d4a456] mb-3">Top Cost Optimization Opportunities</p>
            <div className="space-y-2">
              {[
                { title: "Consolidate LLM Providers", saving: "$1,200/yr", priority: "HIGH" },
                { title: "Optimize GPU Utilization (EU→US)", saving: "$3,100/yr", priority: "HIGH" },
                { title: "Switch to Annual Commitments", saving: "$500/yr", priority: "MEDIUM" },
              ].map((opp) => (
                <div key={opp.title} className="flex items-start justify-between p-3 rounded-lg border border-[#2a2825] gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#D9C8B4]">{opp.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#9baf9c18] text-[#9baf9c] border border-[#9baf9c30]">
                      {opp.saving}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${opp.priority === "HIGH" ? "bg-[#d4836e18] text-[#d4836e] border-[#d4836e30]" : "bg-[#d4a45618] text-[#d4a456] border-[#d4a45630]"}`}>
                      {opp.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Footer note */}
          <p className="text-xs text-[#5c5248] text-center pb-4">
            Sentinel v{report.meta.sentinelVersion} · Local prototype · Not a legal determination ·
            Download the PDF or CSV above for board distribution · Updated: {new Date().toLocaleDateString()}
          </p>
        </>
    </div>
  );
}
