"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { GraphNodeDTO } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type Attrs = Record<string, unknown>;
function attr<T>(node: GraphNodeDTO, key: string): T | undefined {
  return (node.attributes as Attrs)?.[key] as T | undefined;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(n);
}

// Map use case label → short category for grouping
const CATEGORY_COLOR: Record<string, string> = {
  "Knowledge Management":  "text-[#9baf9c]  bg-[#8A9C8B12]  border-[#8A9C8B30]",
  "Workflow Automation":   "text-[#c4d4c5]  bg-[#8A9C8B0A]  border-[#8A9C8B20]",
  "Process Automation":    "text-[#c4d4c5]  bg-[#8A9C8B0A]  border-[#8A9C8B20]",
  "Document Creation":     "text-[#D9C8B4]  bg-[#D9C8B408]  border-[#D9C8B420]",
  "Project Management":    "text-[#d4a96a]  bg-[#C4924A12]  border-[#C4924A30]",
  "Data Management":       "text-[#9a9078]  bg-[#D9C8B408]  border-[#D9C8B415]",
  "Sales Automation":      "text-[#d4836e]  bg-[#C86F5812]  border-[#C86F5830]",
  "Sales Enablement":      "text-[#d4836e]  bg-[#C86F5812]  border-[#C86F5830]",
  "Customer Support":      "text-[#aec0af]  bg-[#8A9C8B10]  border-[#8A9C8B25]",
  "Research Automation":   "text-[#D9C8B4]  bg-[#D9C8B40A]  border-[#D9C8B420]",
  "Meeting Intelligence":  "text-[#c4d4c5]  bg-[#8A9C8B0A]  border-[#8A9C8B20]",
};

// Team label → department display
const TEAM_LABEL: Record<string, string> = {
  ops:      "Operations",
  sales:    "Sales",
  product:  "Product",
  legal:    "Legal",
  finance:  "Finance",
  "cx-ai":  "Customer Experience",
  strategy: "Strategy",
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function CategoryChip({ label }: { label: string }) {
  const cls = CATEGORY_COLOR[label] ?? "text-[#9a9078] bg-[#2a282508] border-[#2a2825]";
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border leading-none ${cls}`}>
      {label}
    </span>
  );
}

function FilterPill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
        active
          ? "bg-[#8A9C8B] text-[#1a1918]"
          : "text-[#9a9078] border border-[#2a2825] hover:text-[#D9C8B4] hover:border-[#8A9C8B44]"
      }`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Use Case card
// ─────────────────────────────────────────────────────────────────────────────

function UseCaseCard({
  uc,
  relatedAssets,
  relatedVendors,
  vendorMap,
}: {
  uc: GraphNodeDTO;
  relatedAssets: GraphNodeDTO[];
  relatedVendors: string[];
  vendorMap: Map<string, GraphNodeDTO>;
}) {
  const totalCost = relatedAssets.reduce(
    (s, a) => s + (attr<number>(a, "monthlyCostUsd") ?? 0),
    0,
  );
  const teams = [...new Set(
    relatedAssets
      .map((a) => (attr<Attrs>(a, "tags") as Attrs)?.team as string | undefined)
      .filter(Boolean) as string[],
  )];

  // Derive category labels from related assets
  const categories = [...new Set(
    relatedAssets.flatMap((a) => attr<string[]>(a, "useCaseLabels") ?? []),
  )].slice(0, 3);

  return (
    <Link
      href={`/use-cases/${encodeURIComponent(uc.id)}`}
      className="flex flex-col border border-[#2a2825] bg-[#1e1c1a] rounded-xl p-4 hover:border-[#8A9C8B44] hover:bg-[#1e2420] transition-all group"
    >
      {/* Title */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h2 className="font-semibold text-[15px] text-[#D9C8B4] group-hover:text-[#c4d4c5] transition-colors leading-snug">
          {uc.label}
        </h2>
        {uc.confidence === "LOW" && (
          <span className="text-[9.5px] font-bold text-[#d4a456] bg-[#C4924A12] border border-[#C4924A30] px-1.5 py-0.5 rounded-full flex-shrink-0">
            Needs review
          </span>
        )}
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {categories.map((c) => <CategoryChip key={c} label={c} />)}
        </div>
      )}

      {/* Vendors */}
      {relatedVendors.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {relatedVendors.slice(0, 5).map((vName) => {
            const vNode = vendorMap.get(vName.toLowerCase());
            return (
              <span key={vName} className="text-[11px] text-[#9a9078] bg-[#252220] border border-[#2a2825] rounded-md px-2 py-0.5">
                {vNode?.label ?? vName}
              </span>
            );
          })}
          {relatedVendors.length > 5 && (
            <span className="text-[11px] text-[#5c5248] px-1 py-0.5">+{relatedVendors.length - 5} more</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-[#242220] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {relatedAssets.length > 0 && (
            <span className="text-[11.5px] text-[#5c5248]">
              <span className="text-[#9baf9c] font-semibold">{relatedAssets.length}</span> tool{relatedAssets.length !== 1 ? "s" : ""}
            </span>
          )}
          {teams.length > 0 && (
            <div className="flex gap-1">
              {teams.slice(0, 3).map((t) => (
                <span key={t} className="text-[10px] text-[#5c5248] font-mono">{t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {totalCost > 0 && (
            <span className="text-[12px] font-semibold text-[#9a9078]">{fmt(totalCost)}<span className="text-[#3a3430] font-normal">/mo</span></span>
          )}
          <span className="text-[11px] text-[#8A9C8B] group-hover:text-[#9baf9c] transition-colors">
            Explore →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  useCases: GraphNodeDTO[];
  vendors:  GraphNodeDTO[];
  assets:   GraphNodeDTO[];
}

export function UseCasesClient({ useCases, vendors, assets }: Props) {
  const [activeTeam,   setActiveTeam]   = useState<string>("all");
  const [activeVendor, setActiveVendor] = useState<string>("all");
  const [search,       setSearch]       = useState("");

  const vendorMap = useMemo(
    () => new Map<string, GraphNodeDTO>(vendors.map((v) => [v.label.toLowerCase(), v])),
    [vendors],
  );

  // Only software vendors (MODEL_DEPLOYMENTs) for filter chips
  const softwareAssets = useMemo(
    () => assets.filter((a) => attr<string>(a, "kind") === "MODEL_DEPLOYMENT"),
    [assets],
  );
  const softwareVendors = useMemo(() => {
    const vs = new Set<string>();
    softwareAssets.forEach((a) => { const v = attr<string>(a, "vendor"); if (v) vs.add(v); });
    return Array.from(vs).sort();
  }, [softwareAssets]);

  // All teams across software assets
  const allTeams = useMemo(() => {
    const ts = new Set<string>();
    softwareAssets.forEach((a) => {
      const t = (attr<Attrs>(a, "tags") as Attrs)?.team as string | undefined;
      if (t) ts.add(t);
    });
    return Array.from(ts).sort();
  }, [softwareAssets]);

  // Compute related assets + vendors per use case
  const ucMeta = useMemo(() => {
    return useCases.map((uc) => {
      const ucLabel = uc.label;
      const related = assets.filter((a) => {
        const ucLabels = attr<string[]>(a, "useCaseLabels") ?? [];
        const project  = (attr<Attrs>(a, "tags") as Attrs)?.project as string | undefined;
        return ucLabels.includes(ucLabel) || project === ucLabel;
      });
      const relatedVendors = [...new Set(
        related.map((a) => attr<string>(a, "vendor")).filter(Boolean) as string[],
      )];
      return { uc, related, relatedVendors };
    });
  }, [useCases, assets]);

  // Apply filters
  const filtered = useMemo(() => {
    return ucMeta.filter(({ uc, related, relatedVendors }) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (!uc.label.toLowerCase().includes(q) &&
            !relatedVendors.some((v) => v.toLowerCase().includes(q))) return false;
      }
      // Team filter — any related asset for this uc with matching team
      if (activeTeam !== "all") {
        const hasTeam = related.some(
          (a) => (attr<Attrs>(a, "tags") as Attrs)?.team === activeTeam,
        );
        if (!hasTeam) return false;
      }
      // Vendor filter
      if (activeVendor !== "all") {
        if (!relatedVendors.includes(activeVendor)) return false;
      }
      return true;
    });
  }, [ucMeta, search, activeTeam, activeVendor]);

  // Stats
  const softwareVendorCount = softwareVendors.length;
  const totalMonthlyCost = softwareAssets.reduce(
    (s, a) => s + (attr<number>(a, "monthlyCostUsd") ?? 0), 0,
  );

  return (
    <div className="space-y-5">

      {/* ── Stats row ── */}
      <div className="flex items-center gap-4 flex-wrap text-[12px] text-[#5c5248]">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c4d4c5]" />
          <span>{useCases.length} use case{useCases.length !== 1 ? "s" : ""}</span>
        </span>
        <span className="text-[#2a2825]">·</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9baf9c]" />
          <span>{softwareAssets.length} software tools</span>
        </span>
        <span className="text-[#2a2825]">·</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d4a456]" />
          <span>{softwareVendorCount} vendors</span>
        </span>
        {totalMonthlyCost > 0 && (
          <>
            <span className="text-[#2a2825]">·</span>
            <span className="text-[#9a9078] font-semibold">{fmt(totalMonthlyCost)}<span className="text-[#5c5248] font-normal">/mo total</span></span>
          </>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="space-y-2.5">
        {/* Row 1: search + team filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5248]" aria-hidden>
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="7.5" y1="7.5" x2="11" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search use cases or vendors…"
              className="pl-8 pr-3 py-1.5 bg-[#161514] border border-[#2a2825] rounded-lg text-[12px] text-[#D9C8B4] placeholder-[#3a3430] focus:outline-none focus:border-[#8A9C8B] transition-colors w-52"
            />
          </div>

          <span className="text-[10px] text-[#3a3430] uppercase tracking-wider font-semibold px-1">Team</span>

          <FilterPill active={activeTeam === "all"} onClick={() => setActiveTeam("all")}>All</FilterPill>
          {allTeams.map((t) => (
            <FilterPill key={t} active={activeTeam === t} onClick={() => setActiveTeam(t)}>
              {TEAM_LABEL[t] ?? t}
            </FilterPill>
          ))}
        </div>

        {/* Row 2: vendor filter — software vendors only, scrollable */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#3a3430] uppercase tracking-wider font-semibold whitespace-nowrap">Vendor</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            <FilterPill active={activeVendor === "all"} onClick={() => setActiveVendor("all")}>All</FilterPill>
            {softwareVendors.map((v) => (
              <FilterPill key={v} active={activeVendor === v} onClick={() => setActiveVendor(v)}>
                {v}
              </FilterPill>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results count ── */}
      {(search || activeTeam !== "all" || activeVendor !== "all") && (
        <p className="text-[11.5px] text-[#5c5248]">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {activeVendor !== "all" && <span> for <span className="text-[#9a9078]">{activeVendor}</span></span>}
          {activeTeam !== "all" && <span> in <span className="text-[#9a9078]">{TEAM_LABEL[activeTeam] ?? activeTeam}</span></span>}
          {search && <span> matching <span className="text-[#9a9078]">"{search}"</span></span>}
          <button onClick={() => { setSearch(""); setActiveTeam("all"); setActiveVendor("all"); }}
            className="ml-2 text-[#5c5248] hover:text-[#9a9078] underline transition-colors">
            Clear
          </button>
        </p>
      )}

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] px-6 py-12 text-center">
          <p className="text-[13px] text-[#5c5248]">No use cases match the current filters.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map(({ uc, related, relatedVendors }) => (
            <UseCaseCard
              key={uc.id}
              uc={uc}
              relatedAssets={related}
              relatedVendors={relatedVendors}
              vendorMap={vendorMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
