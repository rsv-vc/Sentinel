"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { GraphNodeDTO } from "@/lib/api";

type Attrs = Record<string, unknown>;

function attr<T>(node: GraphNodeDTO, key: string): T | undefined {
  return (node.attributes as Attrs)?.[key] as T | undefined;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Vendor card — shows tool count + total spend from related assets
// ─────────────────────────────────────────────────────────────────────────────

function VendorCard({
  vendor,
  toolCount,
  totalSpend,
  categories,
}: {
  vendor: GraphNodeDTO;
  toolCount: number;
  totalSpend: number;
  categories: string[];
}) {
  const code    = attr<string>(vendor, "code");
  const website = attr<string>(vendor, "website");
  const initial = vendor.label[0]?.toUpperCase() ?? "?";

  return (
    <Link
      href={`/nodes/${encodeURIComponent(vendor.id)}`}
      className="flex items-start gap-4 p-4 rounded-xl border border-[#2a2825] bg-[#1e1c1a] hover:border-[#8A9C8B35] hover:bg-[#1e2420] transition-all group"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-lg bg-[#252220] border border-[#2a2825] flex items-center justify-center flex-shrink-0 text-[14px] font-black text-[#9a9078]">
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-semibold text-[#D9C8B4] group-hover:text-[#c4d4c5] transition-colors">
            {vendor.label}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[11px] font-mono text-[#5c5248]">
              {toolCount} {toolCount === 1 ? "tool" : "tools"}
            </span>
            {totalSpend > 0 && (
              <span className="text-[11px] font-semibold text-[#9baf9c]">{fmt(totalSpend)}/mo</span>
            )}
          </div>
        </div>

        {code && (
          <p className="text-[10.5px] text-[#5c5248] font-mono mt-0.5">{code}</p>
        )}

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {categories.slice(0, 4).map((c) => (
              <span key={c} className="text-[10px] text-[#7a8a7b] bg-[#1e2420] border border-[#2a3428] rounded-md px-1.5 py-0.5">
                {c}
              </span>
            ))}
            {categories.length > 4 && (
              <span className="text-[10px] text-[#3a3430] px-1.5 py-0.5">+{categories.length - 4} more</span>
            )}
          </div>
        )}

        {website && (
          <p className="text-[10.5px] text-[#3a3430] mt-1.5 truncate">{website}</p>
        )}
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function VendorsClient({
  vendors,
  assets,
}: {
  vendors: GraphNodeDTO[];
  assets: GraphNodeDTO[];
}) {
  const [search, setSearch] = useState("");

  // Build per-vendor stats from assets
  const vendorStats = useMemo(() => {
    const map: Record<string, { toolCount: number; totalSpend: number; categories: Set<string> }> = {};
    for (const asset of assets) {
      const v = attr<string>(asset, "vendor");
      if (!v) continue;
      if (!map[v]) map[v] = { toolCount: 0, totalSpend: 0, categories: new Set() };
      map[v].toolCount++;
      map[v].totalSpend += attr<number>(asset, "monthlyCostUsd") ?? 0;
      for (const cat of attr<string[]>(asset, "useCaseLabels") ?? []) {
        map[v].categories.add(cat);
      }
    }
    return map;
  }, [assets]);

  const filteredVendors = useMemo(() => {
    if (!search) return vendors;
    const q = search.toLowerCase();
    return vendors.filter((v) => v.label.toLowerCase().includes(q));
  }, [vendors, search]);

  const totalVendorSpend = useMemo(
    () => Object.values(vendorStats).reduce((s, v) => s + v.totalSpend, 0),
    [vendorStats],
  );

  // Sort: most tools first
  const sorted = useMemo(
    () => [...filteredVendors].sort((a, b) => {
      const ta = vendorStats[a.label]?.toolCount ?? 0;
      const tb = vendorStats[b.label]?.toolCount ?? 0;
      return tb - ta;
    }),
    [filteredVendors, vendorStats],
  );

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-[#5c5248]">
            <span className="text-[#9a9078] font-semibold">{vendors.length}</span> vendors
          </span>
          {totalVendorSpend > 0 && (
            <>
              <span className="text-[#2a2825]">·</span>
              <span className="text-[12px] text-[#5c5248]">
                Total spend <span className="text-[#9baf9c] font-semibold">{fmt(totalVendorSpend)}/mo</span>
              </span>
            </>
          )}
        </div>
        {/* Search */}
        <div className="relative">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5248]" aria-hidden>
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
            <line x1="8.5" y1="8.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors…"
            className="pl-8 pr-3 py-1.5 w-52 bg-[#161514] border border-[#2a2825] rounded-lg text-[12.5px] text-[#D9C8B4] placeholder-[#3a3430] focus:outline-none focus:border-[#8A9C8B] transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <p className="text-center text-[12.5px] text-[#5c5248] py-16">No vendors found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sorted.map((v) => {
            const stats = vendorStats[v.label];
            return (
              <VendorCard
                key={v.id}
                vendor={v}
                toolCount={stats?.toolCount ?? 0}
                totalSpend={stats?.totalSpend ?? 0}
                categories={Array.from(stats?.categories ?? [])}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
