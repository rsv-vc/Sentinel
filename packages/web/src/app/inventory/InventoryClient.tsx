"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { GraphNodeDTO } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────────────────────────────────────

type Attrs = Record<string, unknown>;

function attr<T>(node: GraphNodeDTO, key: string): T | undefined {
  return (node.attributes as Attrs)?.[key] as T | undefined;
}

function nodeHref(node: GraphNodeDTO) {
  return node.type === "USE_CASE"
    ? `/use-cases/${encodeURIComponent(node.id)}`
    : `/nodes/${encodeURIComponent(node.id)}`;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing tier badge
// ─────────────────────────────────────────────────────────────────────────────

const PRICING_STYLE: Record<string, string> = {
  freemium:     "text-[#aec0af] bg-[#8A9C8B12] border-[#8A9C8B30]",
  paid:         "text-[#D9C8B4] bg-[#D9C8B408] border-[#D9C8B420]",
  subscription: "text-[#d4a96a] bg-[#C4924A12] border-[#C4924A30]",
};

function PricingBadge({ pricing }: { pricing: string }) {
  const cls = PRICING_STYLE[pricing] ?? PRICING_STYLE.paid;
  const label = pricing === "freemium" ? "Freemium" : pricing === "subscription" ? "Subscription" : "Paid";
  return (
    <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border leading-none ${cls}`}>
      {label}
    </span>
  );
}

function ConfidenceDot({ confidence }: { confidence: string }) {
  const colors: Record<string, string> = { HIGH: "bg-[#9baf9c]", MEDIUM: "bg-[#d4a96a]", LOW: "bg-[#d4836e]" };
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[confidence] ?? colors.MEDIUM}`} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter pill
// ─────────────────────────────────────────────────────────────────────────────

function Pill({
  active, onClick, children, accent,
}: { active: boolean; onClick: () => void; children: React.ReactNode; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap ${
        active
          ? accent
            ? "bg-[#C4924A] text-[#1a1918]"
            : "bg-[#8A9C8B] text-[#1a1918]"
          : "text-[#9a9078] border border-[#2a2825] hover:text-[#D9C8B4] hover:border-[#8A9C8B44]"
      }`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Software card
// ─────────────────────────────────────────────────────────────────────────────

function SoftwareCard({ node }: { node: GraphNodeDTO }) {
  const vendor       = attr<string>(node, "vendor");
  const monthlyCost  = attr<number>(node, "monthlyCostUsd");
  const tags         = attr<Attrs>(node, "tags");
  const pricePerSeat = tags?.pricePerSeat as string | undefined;
  const planName     = tags?.planName     as string | undefined;
  const pricing      = tags?.pricing      as string | undefined;
  const seats        = tags?.seats        as number | undefined;
  const useCaseLabels = attr<string[]>(node, "useCaseLabels") ?? [];

  return (
    <Link
      href={nodeHref(node)}
      className="flex flex-col gap-2 p-4 rounded-xl border border-[#2a2825] bg-[#1e1c1a] hover:border-[#8A9C8B35] hover:bg-[#1e2420] transition-all group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[#D9C8B4] group-hover:text-[#c4d4c5] transition-colors leading-snug">
            {node.label}
          </p>
          {vendor && (
            <p className="text-[11px] text-[#5c5248] mt-0.5">
              by <span className="text-[#9a9078] font-medium">{vendor}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ConfidenceDot confidence={node.confidence} />
          {pricing && <PricingBadge pricing={pricing} />}
        </div>
      </div>

      {/* Use case labels */}
      {useCaseLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {useCaseLabels.map((l) => (
            <span key={l} className="text-[10px] text-[#7a8a7b] bg-[#1e2420] border border-[#2a3428] rounded-md px-1.5 py-0.5">
              {l}
            </span>
          ))}
        </div>
      )}

      {/* Pricing row */}
      <div className="flex items-center justify-between pt-1 border-t border-[#242220] mt-auto">
        <div className="flex items-center gap-3">
          {pricePerSeat && (
            <div>
              <span className="text-[16px] font-bold text-[#D9C8B4]">${pricePerSeat}</span>
              <span className="text-[10.5px] text-[#5c5248] ml-1">/ seat / mo</span>
            </div>
          )}
          {seats && (
            <span className="text-[10.5px] text-[#5c5248]">{seats} seats</span>
          )}
        </div>
        <div className="text-right">
          {monthlyCost != null && (
            <p className="text-[11.5px] font-semibold text-[#9a9078]">{fmt(monthlyCost)}<span className="text-[#5c5248] font-normal">/mo</span></p>
          )}
          {planName && (
            <p className="text-[10px] text-[#3a3430] mt-0.5">{planName} plan</p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hardware card
// ─────────────────────────────────────────────────────────────────────────────

function HardwareCard({ node }: { node: GraphNodeDTO }) {
  const vendor      = attr<string>(node, "vendor");
  const vcpus       = attr<number>(node, "vcpus");
  const capacityGb  = attr<number>(node, "capacityGb");
  const monthlyCost = attr<number>(node, "monthlyCostUsd");
  const tags        = attr<Attrs>(node, "tags");
  const pricePerHr  = tags?.pricePerHour as string | undefined;
  const workload    = tags?.workload     as string | undefined;
  const region      = attr<string>(node, "region");

  return (
    <Link
      href={nodeHref(node)}
      className="flex flex-col gap-2 p-4 rounded-xl border border-[#2a2825] bg-[#1e1c1a] hover:border-[#C4924A35] hover:bg-[#1f1c19] transition-all group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[#D9C8B4] group-hover:text-[#e0d0bc] transition-colors leading-snug">
            {node.label}
          </p>
          {vendor && (
            <p className="text-[11px] text-[#5c5248] mt-0.5">
              <span className="text-[#9a9078] font-medium">{vendor}</span>
              {region && <span className="ml-1.5 font-mono text-[10px]">{region}</span>}
            </p>
          )}
        </div>
        <ConfidenceDot confidence={node.confidence} />
      </div>

      {/* Specs row */}
      <div className="flex flex-wrap gap-3">
        {capacityGb != null && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#5c5248] uppercase tracking-wide">VRAM</span>
            <span className="text-[12px] font-bold text-[#d4a96a]">{capacityGb} GB</span>
          </div>
        )}
        {vcpus != null && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#5c5248] uppercase tracking-wide">vCPU</span>
            <span className="text-[12px] font-semibold text-[#9a9078]">{vcpus}</span>
          </div>
        )}
        {workload && (
          <span className="text-[10px] text-[#7a8060] bg-[#1f1c19] border border-[#2a2820] rounded-md px-1.5 py-0.5">
            {workload}
          </span>
        )}
      </div>

      {/* Pricing row */}
      <div className="flex items-center justify-between pt-1 border-t border-[#242220] mt-auto">
        {pricePerHr && (
          <div>
            <span className="text-[16px] font-bold text-[#D9C8B4]">${pricePerHr}</span>
            <span className="text-[10.5px] text-[#5c5248] ml-1">/ hr</span>
          </div>
        )}
        {monthlyCost != null && (
          <p className="text-[11.5px] font-semibold text-[#9a9078]">{fmt(monthlyCost)}<span className="text-[#5c5248] font-normal">/mo</span></p>
        )}
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic node row (for use cases, vendors, jurisdictions, data assets)
// ─────────────────────────────────────────────────────────────────────────────

function GenericRow({ node }: { node: GraphNodeDTO }) {
  const vendorAttr = attr<string>(node, "vendor");
  const codeAttr   = attr<string>(node, "code");
  const flagAttr   = attr<string>(node, "flag");
  const regs       = attr<string[]>(node, "primaryRegulations");

  return (
    <Link
      href={nodeHref(node)}
      className="flex items-center justify-between p-3.5 rounded-xl border border-[#2a2825] bg-[#1e1c1a] hover:border-[#8A9C8B35] hover:bg-[#1e2420] transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {flagAttr && <span className="text-lg flex-shrink-0">{flagAttr}</span>}
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[#D9C8B4] group-hover:text-[#c4d4c5] transition-colors">
            {node.label}
          </p>
          {codeAttr && !flagAttr && (
            <p className="text-[11px] text-[#5c5248] font-mono mt-0.5">{codeAttr}</p>
          )}
          {vendorAttr && (
            <p className="text-[11px] text-[#5c5248] mt-0.5">
              via <span className="text-[#9a9078]">{vendorAttr}</span>
            </p>
          )}
          {regs && regs.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {regs.slice(0, 3).map((r) => (
                <span key={r} className="text-[9.5px] text-[#5c5248] bg-[#252220] border border-[#2a2825] rounded px-1.5 py-0.5">{r}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <ConfidenceDot confidence={node.confidence} />
        {node.confidence !== "HIGH" && (
          <span className={`text-[9.5px] font-semibold uppercase px-1.5 py-0.5 rounded-full border ${
            node.confidence === "LOW"
              ? "text-[#d4836e] bg-[#C86F5812] border-[#C86F5830]"
              : "text-[#d4a96a] bg-[#C4924A12] border-[#C4924A30]"
          }`}>{node.confidence}</span>
        )}
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({ label, count, color = "text-[#9a9078]" }: { label: string; count: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-2">
      <span className={`text-[11px] font-bold uppercase tracking-[0.1em] ${color}`}>{label}</span>
      <span className="text-[11px] text-[#3a3430]">·</span>
      <span className="text-[11px] text-[#3a3430] font-mono">{count}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Search box
// ─────────────────────────────────────────────────────────────────────────────

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative flex-1 max-w-xs">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5248]" aria-hidden>
        <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
        <line x1="8.5" y1="8.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search…"
        className="w-full pl-8 pr-3 py-1.5 bg-[#161514] border border-[#2a2825] rounded-lg text-[12.5px] text-[#D9C8B4] placeholder-[#3a3430] focus:outline-none focus:border-[#8A9C8B] transition-colors"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "all" | "software" | "hardware" | "use-cases" | "vendors" | "data" | "jurisdictions";

interface Props {
  assets:        GraphNodeDTO[];
  useCases:      GraphNodeDTO[];
  vendors:       GraphNodeDTO[];
  dataAssets:    GraphNodeDTO[];
  jurisdictions: GraphNodeDTO[];
}

export function InventoryClient({ assets, useCases, vendors, dataAssets, jurisdictions }: Props) {
  const [tab,      setTab]      = useState<Tab>("all");
  const [subFilter, setSubFilter] = useState<string>("all");
  const [search,   setSearch]   = useState("");

  // Split assets into software (MODEL_DEPLOYMENT) and hardware (GPU_INSTANCE etc.)
  const software = useMemo(
    () => assets.filter((a) => attr<string>(a, "kind") === "MODEL_DEPLOYMENT"),
    [assets],
  );
  const hardware = useMemo(
    () => assets.filter((a) => attr<string>(a, "kind") !== "MODEL_DEPLOYMENT"),
    [assets],
  );

  // Sub-filter options
  const softwareCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const n of software) {
      const labels = attr<string[]>(n, "useCaseLabels") ?? [];
      labels.forEach((l) => cats.add(l));
    }
    return ["all", ...Array.from(cats).sort()];
  }, [software]);

  const hardwareVendors = useMemo(() => {
    const vs = new Set<string>();
    for (const n of hardware) {
      const v = attr<string>(n, "vendor");
      if (v) vs.add(v);
    }
    return ["all", ...Array.from(vs).sort()];
  }, [hardware]);

  const hardwareWorkloads = useMemo(() => {
    const ws = new Set<string>();
    for (const n of hardware) {
      const t = attr<Attrs>(n, "tags");
      const w = t?.workload as string | undefined;
      if (w) ws.add(w);
    }
    return Array.from(ws).sort();
  }, [hardware]);

  // Apply filters
  function matchSearch(node: GraphNodeDTO) {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      node.label.toLowerCase().includes(q) ||
      (attr<string>(node, "vendor") ?? "").toLowerCase().includes(q)
    );
  }

  const filteredSoftware = useMemo(() => {
    return software.filter((n) => {
      if (!matchSearch(n)) return false;
      if (subFilter === "all") return true;
      return (attr<string[]>(n, "useCaseLabels") ?? []).includes(subFilter);
    });
  }, [software, subFilter, search]);

  const filteredHardware = useMemo(() => {
    return hardware.filter((n) => {
      if (!matchSearch(n)) return false;
      if (subFilter === "all") return true;
      return attr<string>(n, "vendor") === subFilter;
    });
  }, [hardware, subFilter, search]);

  const filteredUseCases     = useCases.filter(matchSearch);
  const filteredVendors      = vendors.filter(matchSearch);
  const filteredDataAssets   = dataAssets.filter(matchSearch);
  const filteredJurisdictions = jurisdictions.filter(matchSearch);

  // Reset sub-filter when top tab changes
  function changeTab(t: Tab) {
    setTab(t);
    setSubFilter("all");
    setSearch("");
  }

  // Stats
  const totalNodes = assets.length + useCases.length + vendors.length + dataAssets.length + jurisdictions.length;
  const lowConf    = [...assets, ...useCases].filter((n) => n.confidence === "LOW" && !n.confirmed).length;

  const totalSoftwareCost = software.reduce((s, n) => s + (attr<number>(n, "monthlyCostUsd") ?? 0), 0);
  const totalHardwareCost = hardware.reduce((s, n) => s + (attr<number>(n, "monthlyCostUsd") ?? 0), 0);

  // ─── render ───────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all",           label: "All",           count: totalNodes },
    { id: "software",      label: "Software",       count: software.length },
    { id: "hardware",      label: "Hardware",       count: hardware.length },
    { id: "use-cases",     label: "Use Cases",      count: useCases.length },
    { id: "vendors",       label: "Vendors",        count: vendors.length },
    { id: "data",          label: "Data Assets",    count: dataAssets.length },
    { id: "jurisdictions", label: "Jurisdictions",  count: jurisdictions.length },
  ];

  return (
    <div className="space-y-5">
      {/* ── Top-level tabs ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map(({ id, label, count }) => (
          <Pill key={id} active={tab === id} onClick={() => changeTab(id)}>
            {label} <span className={`ml-1 text-[10.5px] ${tab === id ? "opacity-70" : "text-[#5c5248]"}`}>{count}</span>
          </Pill>
        ))}
        {lowConf > 0 && (
          <Pill active={false} onClick={() => {}} accent>
            ⚠ {lowConf} need review
          </Pill>
        )}
      </div>

      {/* ── Cost summary strip ── */}
      {(tab === "all" || tab === "software" || tab === "hardware") && (
        <div className="flex items-center gap-4 px-1 flex-wrap">
          {(tab === "all" || tab === "software") && totalSoftwareCost > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-[#5c5248]">Software spend</span>
              <span className="text-[13px] font-semibold text-[#aec0af]">{fmt(totalSoftwareCost)}/mo</span>
            </div>
          )}
          {(tab === "all" || tab === "hardware") && totalHardwareCost > 0 && (
            <>
              {tab === "all" && <span className="text-[#2a2825]">·</span>}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[#5c5248]">Hardware spend</span>
                <span className="text-[13px] font-semibold text-[#d4a96a]">{fmt(totalHardwareCost)}/mo</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Sub-filters + search ── */}
      {(tab === "software" || tab === "hardware") && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <SearchBox value={search} onChange={setSearch} />
            {tab === "software" && softwareCategories.map((c) => (
              <Pill key={c} active={subFilter === c} onClick={() => setSubFilter(c)}>
                {c === "all" ? "All categories" : c}
              </Pill>
            ))}
            {tab === "hardware" && hardwareVendors.map((v) => (
              <Pill key={v} active={subFilter === v} onClick={() => setSubFilter(v)}>
                {v === "all" ? "All vendors" : v}
              </Pill>
            ))}
          </div>
          {tab === "hardware" && hardwareWorkloads.length > 0 && subFilter === "all" && (
            <div className="flex flex-wrap gap-1.5 px-1">
              {hardwareWorkloads.map((w) => (
                <span key={w} className="text-[10px] text-[#5c5248] bg-[#1e1c1a] border border-[#2a2825] rounded-md px-2 py-0.5">
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Search for other tabs ── */}
      {(tab === "all" || tab === "use-cases" || tab === "vendors" || tab === "jurisdictions" || tab === "data") && (
        <SearchBox value={search} onChange={setSearch} />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Content                                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {/* ALL view */}
      {tab === "all" && (
        <div className="space-y-8">
          {/* Software */}
          {filteredSoftware.length > 0 && (
            <div>
              <SectionHeader label="Software — AI Tools" count={filteredSoftware.length} color="text-[#9baf9c]" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredSoftware.map((n) => <SoftwareCard key={n.id} node={n} />)}
              </div>
            </div>
          )}
          {/* Hardware */}
          {filteredHardware.length > 0 && (
            <div>
              <SectionHeader label="Hardware — GPU Compute" count={filteredHardware.length} color="text-[#d4a96a]" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredHardware.map((n) => <HardwareCard key={n.id} node={n} />)}
              </div>
            </div>
          )}
          {/* Use Cases */}
          {filteredUseCases.length > 0 && (
            <div>
              <SectionHeader label="Use Cases" count={filteredUseCases.length} color="text-[#c4d4c5]" />
              <div className="space-y-1.5">
                {filteredUseCases.map((n) => <GenericRow key={n.id} node={n} />)}
              </div>
            </div>
          )}
          {/* Vendors */}
          {filteredVendors.length > 0 && (
            <div>
              <SectionHeader label="Vendors" count={filteredVendors.length} color="text-[#d4a456]" />
              <div className="space-y-1.5">
                {filteredVendors.map((n) => <GenericRow key={n.id} node={n} />)}
              </div>
            </div>
          )}
          {/* Jurisdictions */}
          {filteredJurisdictions.length > 0 && (
            <div>
              <SectionHeader label="Jurisdictions" count={filteredJurisdictions.length} color="text-[#9a9078]" />
              <div className="space-y-1.5">
                {filteredJurisdictions.map((n) => <GenericRow key={n.id} node={n} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SOFTWARE view */}
      {tab === "software" && (
        <div className="space-y-4">
          {filteredSoftware.length === 0 ? (
            <p className="text-center text-[12.5px] text-[#5c5248] py-12">No software tools match the current filter.</p>
          ) : (
            <>
              {/* Group by use case if sub-filter is "all" */}
              {subFilter === "all" ? (
                (() => {
                  const categoryMap: Record<string, GraphNodeDTO[]> = {};
                  for (const n of filteredSoftware) {
                    const labels = attr<string[]>(n, "useCaseLabels") ?? ["Uncategorised"];
                    const primary = labels[0];
                    if (!categoryMap[primary]) categoryMap[primary] = [];
                    categoryMap[primary].push(n);
                  }
                  return Object.entries(categoryMap).sort(([a], [b]) => a.localeCompare(b)).map(([cat, nodes]) => (
                    <div key={cat}>
                      <SectionHeader label={cat} count={nodes.length} color="text-[#9baf9c]" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {nodes.map((n) => <SoftwareCard key={n.id} node={n} />)}
                      </div>
                    </div>
                  ));
                })()
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredSoftware.map((n) => <SoftwareCard key={n.id} node={n} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* HARDWARE view */}
      {tab === "hardware" && (
        <div className="space-y-4">
          {filteredHardware.length === 0 ? (
            <p className="text-center text-[12.5px] text-[#5c5248] py-12">No hardware assets match the current filter.</p>
          ) : (
            <>
              {subFilter === "all" ? (
                (() => {
                  const vendorMap: Record<string, GraphNodeDTO[]> = {};
                  for (const n of filteredHardware) {
                    const v = attr<string>(n, "vendor") ?? "Unknown";
                    if (!vendorMap[v]) vendorMap[v] = [];
                    vendorMap[v].push(n);
                  }
                  return Object.entries(vendorMap).sort(([a], [b]) => a.localeCompare(b)).map(([v, nodes]) => (
                    <div key={v}>
                      <SectionHeader label={v} count={nodes.length} color="text-[#d4a96a]" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {nodes.map((n) => <HardwareCard key={n.id} node={n} />)}
                      </div>
                    </div>
                  ));
                })()
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredHardware.map((n) => <HardwareCard key={n.id} node={n} />)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* USE CASES view */}
      {tab === "use-cases" && (
        <div className="space-y-1.5">
          {filteredUseCases.length === 0
            ? <p className="text-center text-[12.5px] text-[#5c5248] py-12">No use cases found.</p>
            : filteredUseCases.map((n) => <GenericRow key={n.id} node={n} />)
          }
        </div>
      )}

      {/* VENDORS view */}
      {tab === "vendors" && (
        <div className="space-y-1.5">
          {filteredVendors.length === 0
            ? <p className="text-center text-[12.5px] text-[#5c5248] py-12">No vendors found.</p>
            : filteredVendors.map((n) => <GenericRow key={n.id} node={n} />)
          }
        </div>
      )}

      {/* DATA view */}
      {tab === "data" && (
        <div className="space-y-1.5">
          {filteredDataAssets.length === 0
            ? <p className="text-center text-[12.5px] text-[#5c5248] py-12">No data assets found.</p>
            : filteredDataAssets.map((n) => <GenericRow key={n.id} node={n} />)
          }
        </div>
      )}

      {/* JURISDICTIONS view */}
      {tab === "jurisdictions" && (
        <div className="space-y-1.5">
          {filteredJurisdictions.length === 0
            ? <p className="text-center text-[12.5px] text-[#5c5248] py-12">No jurisdictions found.</p>
            : filteredJurisdictions.map((n) => <GenericRow key={n.id} node={n} />)
          }
        </div>
      )}
    </div>
  );
}
