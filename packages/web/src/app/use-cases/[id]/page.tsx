import type { Metadata } from "next";
import Link from "next/link";
import type { RiskLevel, GapStatus } from "@/lib/api";
import { Card, CardTitle } from "@/components/Card";
import { NodeTypeBadge, ConfidenceBadge } from "@/components/Badge";
import { DependencyGraph } from "@/components/DependencyGraph";
import { RectificationPanel } from "@/components/RectificationPanel";

export const metadata: Metadata = { title: "Use Case Detail" };

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: "text-[#9baf9c]", MEDIUM: "text-[#d4a456]", HIGH: "text-[#d4836e]", CRITICAL: "text-[#C86F58]", UN_ASSESSED: "text-[#9a9078]",
};
const RISK_BG: Record<RiskLevel, string> = {
  LOW: "bg-[#8A9C8B18] border-[#8A9C8B30]", MEDIUM: "bg-[#C4924A18] border-[#C4924A30]", HIGH: "bg-[#C86F5818] border-[#C86F5830]", CRITICAL: "bg-[#C86F5828] border-[#C86F5845]", UN_ASSESSED: "bg-[#9a907818] border-[#9a907830]",
};
const GAP_COLOR: Record<GapStatus, string> = { GAP: "text-[#d4836e]", PARTIAL: "text-[#d4a456]", EVIDENCED: "text-[#9baf9c]" };
const GAP_BG: Record<GapStatus, string> = { GAP: "bg-[#C86F5818] border-[#C86F5830]", PARTIAL: "bg-[#C4924A18] border-[#C4924A30]", EVIDENCED: "bg-[#8A9C8B18] border-[#8A9C8B30]" };

function RiskPill({ level }: { level: RiskLevel }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${RISK_BG[level]} ${RISK_COLOR[level]}`}>{level.replace("_", " ")}</span>;
}
function GapPill({ status }: { status: GapStatus }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${GAP_BG[status]} ${GAP_COLOR[status]}`}>{status}</span>;
}

const MOCK_USE_CASES: Record<string, { label: string; riskLevel: RiskLevel; description: string; jurisdictions: string[] }> = {
  "uc-1": { label: "Knowledge Management Assistant", riskLevel: "MEDIUM", description: "Internal Q&A chatbot over company documentation", jurisdictions: ["US", "EU"] },
  "uc-2": { label: "Document Creation Copilot", riskLevel: "LOW", description: "AI-assisted drafting for proposals and reports", jurisdictions: ["US"] },
  "uc-3": { label: "Customer Support Triage", riskLevel: "HIGH", description: "Automated ticket classification and routing", jurisdictions: ["US", "EU", "APAC"] },
  "uc-4": { label: "Code Review Assistant", riskLevel: "LOW", description: "Automated PR review suggestions", jurisdictions: ["US"] },
  "uc-5": { label: "Financial Forecasting Model", riskLevel: "HIGH", description: "ML pipeline for revenue projections", jurisdictions: ["US"] },
};

const mockSubgraph = (id: string, label: string) => ({
  root: { id, label, type: "USE_CASE", confidence: "HIGH", source: "MANUAL", confirmed: true, attributes: {} },
  neighbours: [
    { id: "v-anthropic", label: "Anthropic", type: "VENDOR", confidence: "HIGH", source: "TELEMETRY", confirmed: true, attributes: {} },
    { id: "a-claude", label: "Claude API", type: "ASSET", confidence: "HIGH", source: "TELEMETRY", confirmed: true, attributes: {} },
    { id: "ds-1", label: "Customer Profiles DB", type: "DATA_ASSET", confidence: "MEDIUM", source: "MANUAL", confirmed: false, attributes: {} },
  ],
  edges: [
    { id: "e1", fromId: id, toId: "a-claude", type: "USES_ASSET", attributes: {} },
    { id: "e2", fromId: "a-claude", toId: "v-anthropic", type: "OWNED_BY", attributes: {} },
    { id: "e3", fromId: id, toId: "ds-1", type: "READS_DATA", attributes: {} },
  ],
});

const mockRiskReport = (level: RiskLevel) => ({
  residualLevel: level,
  generatedAt: new Date().toISOString(),
  dimensions: {
    vendor:        { level: level === "HIGH" ? "HIGH" as RiskLevel : "MEDIUM" as RiskLevel, signals: ["Single vendor dependency on Anthropic", "42% portfolio concentration"], hints: ["Consider multi-vendor strategy", "Implement fallback providers"] },
    contractual:   { level: "MEDIUM" as RiskLevel, signals: ["DPA in place", "Annual contract renewal due Q3"], hints: ["Review data processing addendum"] },
    data:          { level: level === "HIGH" ? "HIGH" as RiskLevel : "LOW" as RiskLevel, signals: ["Personal data in scope", "Cross-border EU→US transfer detected"], hints: ["Implement SCCs", "Assess data minimisation"] },
    modelBehaviour:{ level: "MEDIUM" as RiskLevel, signals: ["No evaluation framework defined", "Output monitoring absent"], hints: ["Deploy evals pipeline", "Implement guardrails"] },
    resilience:    { level: "LOW" as RiskLevel, signals: ["Single region deployment", "No documented failover"], hints: ["Add multi-region routing"] },
  },
});

const mockCompReport = (jurisdictions: string[]) => ({
  jurisdictions,
  totalApplicable: 7,
  totalGaps: 2,
  hasModelDeployment: true,
  hasPersonalData: true,
  hasCrossBorderTransfer: jurisdictions.length > 1,
  generatedAt: new Date().toISOString(),
  disclaimer: "This is an automated assessment based on graph evidence. It does not constitute legal advice. Consult qualified legal counsel for compliance decisions.",
  applicableObligations: [
    { obligation: { id: "gdpr-22", title: "Automated Decision-Making", reference: "GDPR Art. 22", description: "Individuals have the right not to be subject to solely automated decisions with significant effects." }, ruleSet: { name: "GDPR", version: "1.1.0" }, gapStatus: "GAP" as GapStatus, signals: ["No human review process documented", "Decisions affect end-users"] },
    { obligation: { id: "eu-ai-9", title: "Fundamental Rights Impact Assessment", reference: "EU AI Act Art. 9", description: "High-risk AI systems must undergo a fundamental rights impact assessment." }, ruleSet: { name: "EU AI Act", version: "1.0.0" }, gapStatus: "PARTIAL" as GapStatus, signals: ["Risk assessment started but incomplete"] },
    { obligation: { id: "gdpr-32", title: "Security of Processing", reference: "GDPR Art. 32", description: "Implement appropriate technical and organisational measures to ensure security." }, ruleSet: { name: "GDPR", version: "1.1.0" }, gapStatus: "EVIDENCED" as GapStatus, signals: ["Encryption at rest confirmed", "Access controls documented"] },
  ],
});

export default async function UseCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const ucData = MOCK_USE_CASES[decodedId] ?? {
    label: `Use Case ${decodedId}`,
    riskLevel: "UN_ASSESSED" as RiskLevel,
    description: "No description available.",
    jurisdictions: ["US"],
  };

  const subgraph   = mockSubgraph(decodedId, ucData.label);
  const riskReport = mockRiskReport(ucData.riskLevel);
  const compReport = mockCompReport(ucData.jurisdictions);
  const rects: any[] = [];
  const root = subgraph.root;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-[#5c5248]">
        <Link href="/use-cases" className="hover:text-[#9a9078] transition-colors">Use Cases</Link>
        <span>/</span>
        <span className="text-[#9a9078]">{root.label}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#D9C8B4]">{root.label}</h1>
          <p className="text-xs text-[#5c5248] font-mono mt-1">{root.id}</p>
          <p className="text-sm text-[#9a9078] mt-2">{ucData.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <NodeTypeBadge type={root.type as any} />
          <ConfidenceBadge confidence={root.confidence as any} />
          <RiskPill level={riskReport.residualLevel} />
        </div>
      </div>

      {/* Risk Report */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Risk Assessment</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5c5248]">Residual</span>
            <RiskPill level={riskReport.residualLevel} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(riskReport.dimensions).map(([key, dim]) => (
            <div key={key} className="border border-[#2a2825] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#D9C8B4] capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <RiskPill level={dim.level} />
              </div>
              <ul className="space-y-0.5">
                {dim.signals.map((s: string, i: number) => (
                  <li key={i} className="text-xs text-[#9a9078] flex gap-2"><span className="text-[#5c5248] flex-shrink-0">·</span>{s}</li>
                ))}
              </ul>
              {dim.hints.length > 0 && (
                <details className="mt-1">
                  <summary className="text-xs text-[#8A9C8B] cursor-pointer hover:text-[#9baf9c]">Remediation hints ({dim.hints.length})</summary>
                  <ul className="mt-1 space-y-0.5 pl-3">
                    {dim.hints.map((h: string, i: number) => <li key={i} className="text-xs text-[#5c5248]">→ {h}</li>)}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Compliance */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <CardTitle>Compliance Obligations</CardTitle>
          <div className="flex items-center gap-3 text-xs text-[#9a9078]">
            <span>Jurisdictions: <span className="text-[#D9C8B4]">{compReport.jurisdictions.join(", ")}</span></span>
            <span>Obligations: <span className="text-[#D9C8B4]">{compReport.totalApplicable}</span></span>
            {compReport.totalGaps > 0 && <span className="text-[#d4836e]">{compReport.totalGaps} gaps</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {compReport.hasPersonalData && <span className="text-xs px-2 py-0.5 rounded-full bg-[#C4924A18] text-[#d4a456] border border-[#C4924A30]">Processes personal data</span>}
          {compReport.hasCrossBorderTransfer && <span className="text-xs px-2 py-0.5 rounded-full bg-[#C86F5818] text-[#d4836e] border border-[#C86F5830]">Cross-border transfer</span>}
        </div>
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
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg border border-[#2a2825] bg-[#1e1c1a]">
          <p className="text-xs text-[#5c5248] leading-relaxed"><span className="text-[#9a9078] font-semibold">Disclaimer: </span>{compReport.disclaimer}</p>
        </div>
      </Card>

      {/* Rectifications */}
      <Card>
        <CardTitle>Rectifications</CardTitle>
        <RectificationPanel rectifications={rects} nodeId={root.id} title="" />
      </Card>

      {/* Dependency Graph */}
      <Card>
        <CardTitle>Dependency Graph</CardTitle>
        <DependencyGraph subgraph={subgraph as any} />
      </Card>

      {/* Neighbours */}
      <Card>
        <CardTitle>Connected Nodes ({subgraph.neighbours.length})</CardTitle>
        <div className="space-y-2">
          {subgraph.neighbours.map((n) => (
            <div key={n.id} className="flex items-center justify-between p-3 rounded-lg border border-[#2a2825]">
              <div>
                <span className="text-sm font-medium text-[#D9C8B4]">{n.label}</span>
                <span className="text-xs text-[#5c5248] ml-2 font-mono">{n.id}</span>
              </div>
              <div className="flex gap-2">
                <NodeTypeBadge type={n.type as any} />
                <ConfidenceBadge confidence={n.confidence as any} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
