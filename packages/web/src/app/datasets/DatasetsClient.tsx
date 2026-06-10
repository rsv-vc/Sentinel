"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { GraphNodeDTO } from "@/lib/api";

type Attrs = Record<string, unknown>;

function attr<T>(node: GraphNodeDTO, key: string): T | undefined {
  return (node.attributes as Attrs)?.[key] as T | undefined;
}

// Sensitivity label colours
const SENSITIVITY_STYLE: Record<string, string> = {
  HIGH:     "text-[#d4836e] bg-[#C86F5812] border-[#C86F5830]",
  MEDIUM:   "text-[#d4a96a] bg-[#C4924A12] border-[#C4924A30]",
  LOW:      "text-[#aec0af] bg-[#8A9C8B12] border-[#8A9C8B30]",
  UNKNOWN:  "text-[#9a9078] bg-[#D9C8B408] border-[#D9C8B420]",
};

function SensitivityBadge({ level }: { level: string }) {
  const cls = SENSITIVITY_STYLE[level] ?? SENSITIVITY_STYLE.UNKNOWN;
  return (
    <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border leading-none ${cls}`}>
      {level}
    </span>
  );
}

function DatasetRow({ node }: { node: GraphNodeDTO }) {
  const sensitivity = attr<string>(node, "sensitivity") ?? "UNKNOWN";
  const category    = attr<string>(node, "category");
  const description = attr<string>(node, "description");
  const pii         = attr<boolean>(node, "containsPii");
  const regions     = attr<string[]>(node, "regions") ?? [];

  return (
    <Link
      href={`/nodes/${encodeURIComponent(node.id)}`}
      className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[#2a2825] bg-[#1e1c1a] hover:border-[#8A9C8B35] hover:bg-[#1e2420] transition-all group"
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Icon */}
        <div className="w-9 h-9 rounded-lg bg-[#252220] border border-[#2a2825] flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#5c5248]">
            <ellipse cx="8" cy="5" rx="5" ry="2.2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3 5v3c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2V5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3 8v3c0 1.2 2.2 2.2 5 2.2s5-1 5-2.2V8" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </div>

        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[#D9C8B4] group-hover:text-[#c4d4c5] transition-colors">
            {node.label}
          </p>
          {description && (
            <p className="text-[11px] text-[#5c5248] mt-0.5 line-clamp-1">{description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-1.5">
            {category && (
              <span className="text-[10px] text-[#7a8a7b] bg-[#1e2420] border border-[#2a3428] rounded-md px-1.5 py-0.5">
                {category}
              </span>
            )}
            {pii && (
              <span className="text-[10px] text-[#d4836e] bg-[#C86F5810] border border-[#C86F5828] rounded-md px-1.5 py-0.5">
                Contains PII
              </span>
            )}
            {regions.slice(0, 2).map((r) => (
              <span key={r} className="text-[10px] text-[#5c5248] font-mono bg-[#1e1c1a] border border-[#2a2825] rounded-md px-1.5 py-0.5">
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        <SensitivityBadge level={sensitivity} />
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#3a3430] group-hover:text-[#9a9078] transition-colors">
          <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function DatasetsClient({ datasets }: { datasets: GraphNodeDTO[] }) {
  const [search,      setSearch]      = useState("");
  const [sensitivity, setSensitivity] = useState<string>("all");

  const sensLevels = useMemo(() => {
    const s = new Set<string>();
    for (const d of datasets) {
      s.add(attr<string>(d, "sensitivity") ?? "UNKNOWN");
    }
    return Array.from(s).sort();
  }, [datasets]);

  const filtered = useMemo(() => {
    return datasets.filter((d) => {
      if (search && !d.label.toLowerCase().includes(search.toLowerCase())) return false;
      if (sensitivity !== "all" && (attr<string>(d, "sensitivity") ?? "UNKNOWN") !== sensitivity) return false;
      return true;
    });
  }, [datasets, search, sensitivity]);

  const piiCount  = datasets.filter((d) => attr<boolean>(d, "containsPii")).length;
  const highCount = datasets.filter((d) => attr<string>(d, "sensitivity") === "HIGH").length;

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[12px] text-[#5c5248]">
            <span className="text-[#9a9078] font-semibold">{datasets.length}</span> data assets
          </span>
          {piiCount > 0 && (
            <>
              <span className="text-[#2a2825]">·</span>
              <span className="text-[12px] text-[#d4836e]">
                {piiCount} contain PII
              </span>
            </>
          )}
          {highCount > 0 && (
            <>
              <span className="text-[#2a2825]">·</span>
              <span className="text-[12px] text-[#d4836e]">
                {highCount} high sensitivity
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
            placeholder="Search data assets…"
            className="pl-8 pr-3 py-1.5 w-52 bg-[#161514] border border-[#2a2825] rounded-lg text-[12.5px] text-[#D9C8B4] placeholder-[#3a3430] focus:outline-none focus:border-[#8A9C8B] transition-colors"
          />
        </div>
      </div>

      {/* Sensitivity filter pills */}
      {sensLevels.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSensitivity("all")}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border ${
              sensitivity === "all"
                ? "bg-[#8A9C8B] text-[#1a1918] border-transparent"
                : "text-[#9a9078] border-[#2a2825] hover:text-[#D9C8B4] hover:border-[#8A9C8B44]"
            }`}
          >
            All sensitivity
          </button>
          {sensLevels.map((s) => (
            <button
              key={s}
              onClick={() => setSensitivity(s)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border ${
                sensitivity === s
                  ? "bg-[#2a2825] text-[#D9C8B4] border-[#3a3835]"
                  : "text-[#9a9078] border-[#2a2825] hover:text-[#D9C8B4] hover:border-[#3a3835]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-center text-[12.5px] text-[#5c5248] py-16">No data assets found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => <DatasetRow key={d.id} node={d} />)}
        </div>
      )}
    </div>
  );
}
