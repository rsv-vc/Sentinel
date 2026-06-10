"use client";

import { useState, useTransition } from "react";
import type { GraphNodeDTO, UseCaseComplianceReportDTO, ObligationResultDTO } from "@/lib/api";
import { getUseCaseCompliance } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Jurisdiction metadata (mirrors normalization.service.ts)
// ─────────────────────────────────────────────────────────────────────────────

const JURISDICTION_META: Record<string, { flag: string; primaryRegulations: string[]; enforcementBody: string; aiFramework: string }> = {
  US: { flag: "🇺🇸", primaryRegulations: ["NIST AI RMF 1.0", "EO 14110", "CCPA (California)"], enforcementBody: "NIST / FTC", aiFramework: "NIST AI Risk Management Framework" },
  EU: { flag: "🇪🇺", primaryRegulations: ["GDPR", "EU AI Act", "NIS2 Directive"], enforcementBody: "National DPAs / EU AI Office", aiFramework: "EU AI Act (Annex III)" },
  GB: { flag: "🇬🇧", primaryRegulations: ["UK GDPR", "Data Protection Act 2018", "ICO AI Guidance 2024"], enforcementBody: "ICO / DSIT", aiFramework: "UK DSIT AI Regulation Principles" },
  SG: { flag: "🇸🇬", primaryRegulations: ["PDPA 2012 (amended 2021)", "MAS FEAT Principles", "AI Verify Framework"], enforcementBody: "PDPC / MAS", aiFramework: "IMDA Model AI Governance Framework" },
  JP: { flag: "🇯🇵", primaryRegulations: ["APPI (amended 2022)", "METI AI Guidelines 2024", "Basic Act on AI"], enforcementBody: "PPC / METI", aiFramework: "METI AI Guidelines for Business 2024" },
  AU: { flag: "🇦🇺", primaryRegulations: ["Privacy Act 1988 (amended 2024)", "AI Ethics Framework", "SOCI Act"], enforcementBody: "OAIC / DISR", aiFramework: "Australia AI Ethics Framework" },
  CA: { flag: "🇨🇦", primaryRegulations: ["PIPEDA / Bill C-27 (CPPA)", "AIDA", "Quebec Law 25"], enforcementBody: "OPC / ISED", aiFramework: "AIDA — Artificial Intelligence and Data Act" },
  BR: { flag: "🇧🇷", primaryRegulations: ["LGPD", "PL 2338/2023 (AI Bill)"], enforcementBody: "ANPD", aiFramework: "PL 2338/2023 — Brazilian AI Framework" },
  IN: { flag: "🇮🇳", primaryRegulations: ["DPDP Act 2023", "IT Act 2000", "SEBI AI/ML Guidelines"], enforcementBody: "Data Protection Board of India", aiFramework: "MeitY Responsible AI Framework" },
  CN: { flag: "🇨🇳", primaryRegulations: ["PIPL 2021", "Generative AI Regulations 2023", "Algorithm Recommendation Regulations"], enforcementBody: "CAC / MIIT", aiFramework: "CAC Generative AI Service Management Provisions" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function GapBadge({ status }: { status: "GAP" | "PARTIAL" | "EVIDENCED" }) {
  const styles = {
    GAP:      "bg-[#C86F5818] text-[#d4836e] border-[#C86F5840]",
    PARTIAL:  "bg-[#C4924A18] text-[#d4a96a] border-[#C4924A40]",
    EVIDENCED:"bg-[#8A9C8B18] text-[#aec0af] border-[#8A9C8B40]",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border leading-none ${styles[status]}`}>
      {status === "GAP" && <span className="w-1.5 h-1.5 rounded-full bg-[#d4836e] flex-shrink-0" />}
      {status === "PARTIAL" && <span className="w-1.5 h-1.5 rounded-full bg-[#d4a96a] flex-shrink-0" />}
      {status === "EVIDENCED" && <span className="w-1.5 h-1.5 rounded-full bg-[#aec0af] flex-shrink-0" />}
      {status}
    </span>
  );
}

function ObligationRow({ item, isLast }: { item: ObligationResultDTO; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`py-3 ${isLast ? "" : "border-b border-[#2a2825]"}`}>
      <button
        className="w-full flex items-start gap-3 text-left group"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Status indicator */}
        <div className="mt-[3px] flex-shrink-0">
          <GapBadge status={item.gapStatus} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-medium text-[#D9C8B4] group-hover:text-white transition-colors">
              {item.obligation.title}
            </span>
            <span className="text-[10px] text-[#5c5248] font-mono">{item.ruleSet.name}</span>
          </div>
          {expanded && (
            <div className="mt-2 space-y-2">
              <p className="text-[12px] text-[#9a9078] leading-relaxed">{item.obligation.description}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {item.signals.map((s, i) => (
                  <span key={i} className="text-[10.5px] text-[#7a8a7b] bg-[#1e2420] border border-[#2a3428] rounded-md px-2 py-0.5">
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-[10.5px] text-[#5c5248] italic">{item.obligation.reference}</p>
            </div>
          )}
        </div>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`flex-shrink-0 mt-1 text-[#5c5248] transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

function JurisdictionCard({ code, obligations }: { code: string; obligations: ObligationResultDTO[] }) {
  const meta = JURISDICTION_META[code] ?? { flag: "🌐", primaryRegulations: [], enforcementBody: "Unknown", aiFramework: "—" };
  const gaps     = obligations.filter((o) => o.gapStatus === "GAP").length;
  const partial  = obligations.filter((o) => o.gapStatus === "PARTIAL").length;
  const evidenced = obligations.filter((o) => o.gapStatus === "EVIDENCED").length;

  const COUNTRY_NAMES: Record<string, string> = {
    US: "United States", EU: "European Union", GB: "United Kingdom",
    SG: "Singapore", JP: "Japan", AU: "Australia", CA: "Canada",
    BR: "Brazil", IN: "India", CN: "China",
  };

  return (
    <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2825] bg-[#211f1d]">
        <span className="text-2xl leading-none">{meta.flag}</span>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-[#D9C8B4]">{COUNTRY_NAMES[code] ?? code}</p>
          <p className="text-[11px] text-[#5c5248] mt-0.5">{meta.enforcementBody}</p>
        </div>
        <div className="flex items-center gap-2">
          {gaps > 0 && (
            <span className="text-[10px] font-bold text-[#d4836e] bg-[#C86F5818] border border-[#C86F5840] px-2 py-0.5 rounded-full">
              {gaps} gap{gaps !== 1 ? "s" : ""}
            </span>
          )}
          {partial > 0 && (
            <span className="text-[10px] font-bold text-[#d4a96a] bg-[#C4924A18] border border-[#C4924A40] px-2 py-0.5 rounded-full">
              {partial} partial
            </span>
          )}
          {evidenced > 0 && (
            <span className="text-[10px] font-bold text-[#aec0af] bg-[#8A9C8B18] border border-[#8A9C8B40] px-2 py-0.5 rounded-full">
              {evidenced} evidenced
            </span>
          )}
        </div>
      </div>

      {/* Regulations row */}
      <div className="px-4 py-2.5 border-b border-[#2a2825] flex flex-wrap gap-1.5">
        {meta.primaryRegulations.map((r) => (
          <span key={r} className="text-[10px] text-[#7a7060] bg-[#252220] border border-[#2a2825] rounded-md px-1.5 py-0.5">
            {r}
          </span>
        ))}
      </div>

      {/* Obligations list */}
      <div className="px-4">
        {obligations.length === 0 ? (
          <p className="text-[12px] text-[#5c5248] py-4 text-center italic">No applicable obligations for this use case.</p>
        ) : (
          obligations.map((item, i) => (
            <ObligationRow key={item.obligation.id} item={item} isLast={i === obligations.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  useCases: GraphNodeDTO[];
  jurisdictions: GraphNodeDTO[];
}

export function ComplianceAnalysis({ useCases, jurisdictions }: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [report, setReport] = useState<UseCaseComplianceReportDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAnalysis() {
    if (!selectedId) return;
    setError(null);
    setReport(null);
    startTransition(async () => {
      try {
        const data = await getUseCaseCompliance(selectedId);
        setReport(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    });
  }

  // Group obligations by jurisdiction code
  const byJurisdiction: Record<string, ObligationResultDTO[]> = {};
  if (report) {
    for (const ob of report.applicableObligations) {
      for (const j of ob.obligation.jurisdictions) {
        if (!byJurisdiction[j]) byJurisdiction[j] = [];
        byJurisdiction[j].push(ob);
      }
    }
  }

  const orderedJurisdictions = report
    ? [...new Set(report.applicableObligations.flatMap((o) => o.obligation.jurisdictions))].sort()
    : [];

  return (
    <div className="space-y-5">
      {/* Use case selector */}
      <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#5c5248] mb-3">Select Use Case</p>
        <div className="flex items-center gap-3">
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setReport(null); }}
            className="flex-1 bg-[#161514] border border-[#2a2825] rounded-lg px-3 py-2 text-[13px] text-[#D9C8B4] appearance-none focus:outline-none focus:border-[#8A9C8B] transition-colors"
          >
            <option value="">— Choose a use case —</option>
            {useCases.map((uc) => (
              <option key={uc.id} value={uc.id}>{uc.label}</option>
            ))}
          </select>
          <button
            onClick={runAnalysis}
            disabled={!selectedId || isPending}
            className="px-4 py-2 rounded-lg text-[12.5px] font-semibold bg-[#8A9C8B] text-[#1a1918] hover:bg-[#9baf9c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="14" strokeDashoffset="4" strokeLinecap="round"/>
                </svg>
                Analysing…
              </span>
            ) : "Run Analysis"}
          </button>
        </div>

        {/* Jurisdiction chips */}
        {jurisdictions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-[10px] text-[#5c5248] mr-1 self-center">Detected jurisdictions:</span>
            {jurisdictions.map((j) => {
              const attrs = j.attributes as Record<string, unknown>;
              const code = (attrs?.code as string) ?? j.label;
              const flag = (attrs?.flag as string) ?? JURISDICTION_META[code]?.flag ?? "🌐";
              return (
                <span key={j.id} className="text-[10.5px] text-[#9a9078] bg-[#252220] border border-[#2a2825] rounded-full px-2 py-0.5 flex items-center gap-1">
                  <span>{flag}</span> {j.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-[#C86F5840] bg-[#C86F5808] px-4 py-3 text-[12.5px] text-[#d4836e]">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isPending && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-[#2a2825] bg-[#1e1c1a] animate-pulse" />
          ))}
        </div>
      )}

      {/* Report */}
      {report && !isPending && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] px-4 py-3 flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-[10px] text-[#5c5248] uppercase tracking-wider">Use Case</p>
              <p className="text-[14px] font-semibold text-[#D9C8B4] mt-0.5">{report.useCaseLabel}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#5c5248] uppercase tracking-wider">Total Obligations</p>
              <p className="text-[14px] font-semibold text-[#D9C8B4] mt-0.5">{report.totalApplicable}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#5c5248] uppercase tracking-wider">Gaps</p>
              <p className="text-[14px] font-semibold text-[#d4836e] mt-0.5">{report.totalGaps}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {report.hasCrossBorderTransfer && (
                <span className="text-[10px] text-[#d4a96a] bg-[#C4924A12] border border-[#C4924A30] px-2 py-0.5 rounded-full font-medium">Cross-border transfer</span>
              )}
              {report.hasModelDeployment && (
                <span className="text-[10px] text-[#aec0af] bg-[#8A9C8B12] border border-[#8A9C8B30] px-2 py-0.5 rounded-full font-medium">Model deployment</span>
              )}
              {report.hasPersonalData && (
                <span className="text-[10px] text-[#9a9078] bg-[#D9C8B408] border border-[#D9C8B420] px-2 py-0.5 rounded-full font-medium">Personal data</span>
              )}
            </div>
          </div>

          {/* No obligations */}
          {report.totalApplicable === 0 && (
            <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] px-6 py-10 text-center">
              <p className="text-[13px] text-[#9a9078]">No applicable compliance obligations found for this use case.</p>
              <p className="text-[11.5px] text-[#5c5248] mt-1">This may indicate the use case has no connected assets in detected jurisdictions.</p>
            </div>
          )}

          {/* Per-jurisdiction cards */}
          {orderedJurisdictions.map((jCode) => (
            <JurisdictionCard
              key={jCode}
              code={jCode}
              obligations={byJurisdiction[jCode] ?? []}
            />
          ))}

          {/* Disclaimer */}
          <div className="rounded-lg border border-[#2a2825] bg-[#161514] px-4 py-3">
            <p className="text-[10.5px] text-[#5c5248] leading-relaxed">
              <span className="font-semibold text-[#3a3430]">Disclaimer — </span>
              {report.disclaimer}
            </p>
            <p className="text-[10px] text-[#3a3430] mt-1">
              Generated {new Date(report.generatedAt).toLocaleString()} · Rule-sets as of {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
