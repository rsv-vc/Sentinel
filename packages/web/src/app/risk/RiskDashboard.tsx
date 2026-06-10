"use client";

import { useState } from "react";
import Link from "next/link";
import type { PortfolioRiskReportDTO, GraphNodeDTO } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type Attrs = Record<string, unknown>;
function attr<T>(node: GraphNodeDTO, key: string): T | undefined {
  return (node.attributes as Attrs)?.[key] as T | undefined;
}

const RISK_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UN_ASSESSED: 4 };

const RISK_COLORS: Record<string, { text: string; bg: string; border: string; bar: string }> = {
  CRITICAL:    { text: "text-[#e05c4a]", bg: "bg-[#C86F5818]", border: "border-[#C86F5840]", bar: "#C86F58" },
  HIGH:        { text: "text-[#d4836e]", bg: "bg-[#C86F5812]", border: "border-[#C86F5830]", bar: "#d4836e" },
  MEDIUM:      { text: "text-[#d4a96a]", bg: "bg-[#C4924A12]", border: "border-[#C4924A30]", bar: "#C4924A" },
  LOW:         { text: "text-[#aec0af]", bg: "bg-[#8A9C8B12]", border: "border-[#8A9C8B30]", bar: "#8A9C8B" },
  UN_ASSESSED: { text: "text-[#9a9078]", bg: "bg-[#D9C8B408]", border: "border-[#D9C8B420]", bar: "#5c5248" },
};

function RiskBadge({ level }: { level: string }) {
  const c = RISK_COLORS[level] ?? RISK_COLORS.UN_ASSESSED;
  return (
    <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border leading-none ${c.text} ${c.bg} ${c.border}`}>
      {level.replace("_", " ")}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Risk distribution bar
// ─────────────────────────────────────────────────────────────────────────────

function RiskDistribution({ byLevel, total }: { byLevel: Record<string, number>; total: number }) {
  const levels = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UN_ASSESSED"];
  return (
    <div className="space-y-2.5">
      {levels.map((level) => {
        const count = byLevel[level] ?? 0;
        const pct   = total > 0 ? (count / total) * 100 : 0;
        const c     = RISK_COLORS[level] ?? RISK_COLORS.UN_ASSESSED;
        return (
          <div key={level}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[12px] font-medium ${c.text}`}>{level.replace("_", " ")}</span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-[#D9C8B4]">{count}</span>
                <span className="text-[10px] text-[#5c5248] w-8 text-right">{Math.round(pct)}%</span>
              </div>
            </div>
            <div className="h-2 bg-[#2a2825] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, background: c.bar, boxShadow: `0 0 6px ${c.bar}44` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Concentration flag card
// ─────────────────────────────────────────────────────────────────────────────

function ConcentrationCard({ flag }: { flag: PortfolioRiskReportDTO["concentrationFlags"][number] }) {
  const share = Math.round(flag.portfolioShare * 100);
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#C4924A25] bg-[#1f1c19]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#251e17] border border-[#C4924A20] flex items-center justify-center text-sm font-black text-[#d4a96a]">
          {flag.vendorLabel[0]}
        </div>
        <div>
          <p className="text-[13px] font-medium text-[#D9C8B4]">{flag.vendorLabel}</p>
          <p className="text-[11px] text-[#5c5248]">{flag.useCaseCount} use cases</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[18px] font-black text-[#d4a96a]">{share}%</p>
        <p className="text-[10px] text-[#5c5248]">portfolio share</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Use case risk row
// ─────────────────────────────────────────────────────────────────────────────

function UseCaseRiskRow({ node }: { node: GraphNodeDTO }) {
  const tags       = attr<Attrs>(node, "tags");
  const risk       = (tags?.residualRisk as string | undefined) ?? "UN_ASSESSED";
  const team       = tags?.team as string | undefined;
  const TEAM_MAP: Record<string, string> = {
    ops: "Operations", sales: "Sales", product: "Product",
    legal: "Legal", finance: "Finance", "cx-ai": "CX", strategy: "Strategy",
  };

  return (
    <Link
      href={`/use-cases/${encodeURIComponent(node.id)}`}
      className="flex items-center justify-between p-3 rounded-xl border border-[#2a2825] bg-[#1e1c1a] hover:border-[#8A9C8B35] hover:bg-[#1e2420] transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <RiskBadge level={risk} />
        <p className="text-[12.5px] text-[#D9C8B4] group-hover:text-[#c4d4c5] transition-colors truncate">{node.label}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        {team && (
          <span className="text-[10px] text-[#5c5248]">{TEAM_MAP[team] ?? team}</span>
        )}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[#3a3430] group-hover:text-[#9a9078]">
          <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI tile
// ─────────────────────────────────────────────────────────────────────────────

function KpiTile({
  label, value, sub, color = "text-[#D9C8B4]", bg = "bg-[#1e1c1a]", border = "border-[#2a2825]",
}: {
  label: string; value: number | string; sub?: string;
  color?: string; bg?: string; border?: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${bg} ${border}`}>
      <p className={`text-[28px] font-black leading-none ${color}`}>{value}</p>
      <p className="text-[11.5px] text-[#D9C8B4] font-medium mt-1">{label}</p>
      {sub && <p className="text-[10.5px] text-[#5c5248] mt-0.5">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function RiskDashboard({
  portfolio,
  useCases,
  openRects,
}: {
  portfolio:  PortfolioRiskReportDTO | null;
  useCases:   GraphNodeDTO[];
  openRects:  number;
}) {
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const byLevel   = portfolio?.byLevel ?? {};
  const total     = portfolio?.totalUseCases ?? 0;
  const highCrit  = portfolio?.highOrCritical ?? 0;
  const unassessed = portfolio?.unassessed ?? 0;
  const flags     = portfolio?.concentrationFlags ?? [];

  // Sort use cases by risk level
  const sortedUseCases = [...useCases].sort((a, b) => {
    const ra = (attr<Attrs>(a, "tags")?.residualRisk as string | undefined) ?? "UN_ASSESSED";
    const rb = (attr<Attrs>(b, "tags")?.residualRisk as string | undefined) ?? "UN_ASSESSED";
    return (RISK_ORDER[ra] ?? 99) - (RISK_ORDER[rb] ?? 99);
  });

  const filteredUseCases = riskFilter === "all"
    ? sortedUseCases
    : sortedUseCases.filter((uc) => {
        const r = (attr<Attrs>(uc, "tags")?.residualRisk as string | undefined) ?? "UN_ASSESSED";
        return r === riskFilter;
      });

  const riskLevels = ["all", "CRITICAL", "HIGH", "MEDIUM", "LOW", "UN_ASSESSED"];

  return (
    <div className="space-y-6">

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile
          label="Total use cases" value={total}
          sub="in portfolio"
        />
        <KpiTile
          label="High / Critical" value={highCrit}
          color={highCrit > 0 ? "text-[#d4836e]" : "text-[#D9C8B4]"}
          bg={highCrit > 0 ? "bg-[#C86F5808]" : "bg-[#1e1c1a]"}
          border={highCrit > 0 ? "border-[#C86F5825]" : "border-[#2a2825]"}
          sub="need immediate action"
        />
        <KpiTile
          label="Unassessed" value={unassessed}
          color={unassessed > 0 ? "text-[#d4a96a]" : "text-[#D9C8B4]"}
          sub="no risk evaluation"
        />
        <Link href="/rectifications">
          <div className={`rounded-xl border p-4 transition-colors ${
            openRects > 0
              ? "bg-[#C4924A08] border-[#C4924A25] hover:border-[#C4924A45]"
              : "bg-[#1e1c1a] border-[#2a2825] hover:border-[#3a3835]"
          }`}>
            <p className={`text-[28px] font-black leading-none ${openRects > 0 ? "text-[#d4a96a]" : "text-[#D9C8B4]"}`}>{openRects}</p>
            <p className="text-[11.5px] text-[#D9C8B4] font-medium mt-1">Open rectifications</p>
            <p className="text-[10.5px] text-[#5c5248] mt-0.5">tap to manage →</p>
          </div>
        </Link>
      </div>

      {/* ── Main 2-col ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Risk distribution */}
        <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#5c5248] mb-4">Risk distribution</p>
          {total === 0 ? (
            <p className="text-[12.5px] text-[#5c5248] text-center py-6">No use cases found.</p>
          ) : (
            <RiskDistribution byLevel={byLevel} total={total} />
          )}
        </div>

        {/* Concentration flags */}
        <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] p-5">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#5c5248] mb-4">
            Vendor concentration
          </p>
          {flags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-2xl">✓</span>
              <p className="text-[12.5px] text-[#9baf9c] font-medium">No concentration flags</p>
              <p className="text-[11px] text-[#5c5248]">No single vendor dominates your portfolio.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {flags.map((f) => <ConcentrationCard key={f.vendorId} flag={f} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Use cases by risk ── */}
      <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#5c5248]">
            Use cases by risk level
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {riskLevels.map((lvl) => {
              const c = lvl !== "all" ? RISK_COLORS[lvl] : null;
              return (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
                    riskFilter === lvl
                      ? c
                        ? `${c.text} ${c.bg} ${c.border}`
                        : "bg-[#2a2825] text-[#D9C8B4] border-[#3a3835]"
                      : "text-[#5c5248] border-[#2a2825] hover:text-[#9a9078]"
                  }`}
                >
                  {lvl === "all" ? "All" : lvl.replace("_", " ")}
                  {lvl !== "all" && (
                    <span className="ml-1 opacity-60">{byLevel[lvl] ?? 0}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {filteredUseCases.length === 0 ? (
          <p className="text-center text-[12.5px] text-[#5c5248] py-8">No use cases at this risk level.</p>
        ) : (
          <div className="space-y-1.5">
            {filteredUseCases.map((uc) => <UseCaseRiskRow key={uc.id} node={uc} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[11px] text-[#3a3430]">
          Risk levels computed by Sentinel's ComplianceEngine against portfolio signals.
        </p>
        <Link
          href="/rectifications"
          className="text-[11.5px] text-[#8A9C8B] hover:text-[#9baf9c] transition-colors"
        >
          Manage open rectifications →
        </Link>
      </div>
    </div>
  );
}
