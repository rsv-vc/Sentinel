"use client";

import { useState } from "react";
import Link         from "next/link";
import type { GraphNodeDTO } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type Attrs = Record<string, unknown>;
function attr<T>(node: GraphNodeDTO, key: string): T | undefined {
  return (node.attributes as Attrs)?.[key] as T | undefined;
}

// Jurisdiction → known regulation meta (mirrors normalization.service.ts JURISDICTION_META)
const JURIS_META: Record<string, {
  flag: string;
  primaryRegulations: string[];
  enforcementBody: string;
  aiFramework: string;
}> = {
  EU: { flag: "🇪🇺", primaryRegulations: ["GDPR", "EU AI Act"], enforcementBody: "European Data Protection Board", aiFramework: "EU AI Act (2024)" },
  GB: { flag: "🇬🇧", primaryRegulations: ["UK GDPR", "DPA 2018"], enforcementBody: "ICO", aiFramework: "UK AI Safety Institute" },
  US: { flag: "🇺🇸", primaryRegulations: ["CCPA", "NIST AI RMF"], enforcementBody: "FTC / State AGs", aiFramework: "NIST AI RMF (2023)" },
  SG: { flag: "🇸🇬", primaryRegulations: ["PDPA", "MAS FEAT"], enforcementBody: "PDPC", aiFramework: "AI Verify (2023)" },
  JP: { flag: "🇯🇵", primaryRegulations: ["APPI", "METI AI Guidelines"], enforcementBody: "PPC / METI", aiFramework: "AI Guidelines for Business (2024)" },
  AU: { flag: "🇦🇺", primaryRegulations: ["Privacy Act 1988", "AI Ethics Framework"], enforcementBody: "OAIC", aiFramework: "Australia's AI Ethics Framework" },
  CA: { flag: "🇨🇦", primaryRegulations: ["CPPA", "AIDA"], enforcementBody: "OPC", aiFramework: "AIDA (Bill C-27)" },
  BR: { flag: "🇧🇷", primaryRegulations: ["LGPD", "PL 2338/2023"], enforcementBody: "ANPD", aiFramework: "AI Bill PL 2338 (2023)" },
  IN: { flag: "🇮🇳", primaryRegulations: ["DPDP Act 2023"], enforcementBody: "Data Protection Board", aiFramework: "DPDP Act (2023)" },
  CN: { flag: "🇨🇳", primaryRegulations: ["PIPL", "GenAI Regulations"], enforcementBody: "CAC / MIIT", aiFramework: "Interim GenAI Measures (2023)" },
};

const COUNTRY_NAMES: Record<string, string> = {
  EU: "European Union", GB: "United Kingdom", US: "United States",
  SG: "Singapore",      JP: "Japan",          AU: "Australia",
  CA: "Canada",         BR: "Brazil",         IN: "India", CN: "China",
};

// All 10 jurisdictions — hardcoded so display never depends on DB seeding
const ALL_JURIS_CODES = Object.keys(JURIS_META);

// ─────────────────────────────────────────────────────────────────────────────
// Jurisdiction card
// ─────────────────────────────────────────────────────────────────────────────

function JurisdictionCard({
  code,
  assetCount,
  useCaseCount,
}: {
  code: string;
  assetCount: number;
  useCaseCount: number;
}) {
  const meta = JURIS_META[code] ?? {
    flag: "🌐",
    primaryRegulations: [],
    enforcementBody: "Unknown",
    aiFramework: "Unknown",
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-[#2a2825] bg-[#1e1c1a] hover:border-[#8A9C8B30] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">{meta.flag}</span>
          <div>
            <p className="text-[13.5px] font-semibold text-[#D9C8B4]">{COUNTRY_NAMES[code] ?? code}</p>
            <p className="text-[10px] text-[#5c5248] font-mono mt-0.5">{code}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          {assetCount > 0 && (
            <span className="text-[10px] text-[#9a9078]">{assetCount} tools</span>
          )}
          {useCaseCount > 0 && (
            <span className="text-[10px] text-[#5c5248]">{useCaseCount} use cases</span>
          )}
        </div>
      </div>

      {/* Regulations */}
      <div className="flex flex-wrap gap-1">
        {meta.primaryRegulations.map((r) => (
          <span key={r} className="text-[10px] text-[#9a9078] bg-[#252220] border border-[#2a2825] rounded-md px-1.5 py-0.5">
            {r}
          </span>
        ))}
      </div>

      {/* Enforcement + AI framework */}
      <div className="space-y-1.5 pt-2 border-t border-[#242220]">
        <div className="flex items-start gap-2">
          <span className="text-[9.5px] text-[#3a3430] uppercase tracking-wider w-20 flex-shrink-0 mt-0.5">Enforcer</span>
          <span className="text-[11px] text-[#5c5248]">{meta.enforcementBody}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[9.5px] text-[#3a3430] uppercase tracking-wider w-20 flex-shrink-0 mt-0.5">AI Frame</span>
          <span className="text-[11px] text-[#5c5248]">{meta.aiFramework}</span>
        </div>
      </div>

      {/* Run compliance analysis link */}
      <Link
        href="/compliance"
        className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[#2a2825] text-[11px] text-[#5c5248] hover:text-[#9baf9c] hover:border-[#8A9C8B35] transition-colors"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
          <path d="M1 5.5h9M6 2l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Run compliance analysis
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Policy framework overview
// ─────────────────────────────────────────────────────────────────────────────

const FRAMEWORKS = [
  {
    id: "gdpr",       name: "GDPR",               region: "EU",   status: "Active",   color: "text-[#9baf9c]",  dot: "bg-[#9baf9c]",
    desc: "General Data Protection Regulation — data subject rights, DPO requirements, consent.",
  },
  {
    id: "eu-ai-act",  name: "EU AI Act",           region: "EU",   status: "Active",   color: "text-[#9baf9c]",  dot: "bg-[#9baf9c]",
    desc: "Risk-based AI regulation with Prohibited, High-Risk, Limited, and Minimal risk tiers.",
  },
  {
    id: "uk-gdpr",    name: "UK GDPR",             region: "GB",   status: "Active",   color: "text-[#9baf9c]",  dot: "bg-[#9baf9c]",
    desc: "Post-Brexit data protection law with ICO AI transparency guidance.",
  },
  {
    id: "nist-ai",    name: "NIST AI RMF",         region: "US",   status: "Active",   color: "text-[#9baf9c]",  dot: "bg-[#9baf9c]",
    desc: "Voluntary framework for managing AI risk: GOVERN, MAP, MEASURE, MANAGE.",
  },
  {
    id: "dpdp",       name: "DPDP Act 2023",       region: "IN",   status: "Active",   color: "text-[#9baf9c]",  dot: "bg-[#9baf9c]",
    desc: "India's Digital Personal Data Protection Act — consent, data fiduciary obligations.",
  },
  {
    id: "sg-pdpa",    name: "PDPA / AI Verify",    region: "SG",   status: "Active",   color: "text-[#9baf9c]",  dot: "bg-[#9baf9c]",
    desc: "Singapore PDPA + MAS FEAT Principles + IMDA AI Verify testing framework.",
  },
  {
    id: "ca-aida",    name: "AIDA (Bill C-27)",    region: "CA",   status: "Pending",  color: "text-[#d4a96a]",  dot: "bg-[#d4a96a]",
    desc: "Artificial Intelligence and Data Act — high-impact systems, audit requirements.",
  },
  {
    id: "br-lgpd",    name: "LGPD / PL 2338",      region: "BR",   status: "Active",   color: "text-[#9baf9c]",  dot: "bg-[#9baf9c]",
    desc: "Brazilian LGPD data protection + AI Bill PL 2338 transparency obligations.",
  },
  {
    id: "cn-pipl",    name: "PIPL / GenAI",        region: "CN",   status: "Active",   color: "text-[#9baf9c]",  dot: "bg-[#9baf9c]",
    desc: "China's PIPL + Interim GenAI Measures — security assessment, algorithm transparency.",
  },
  {
    id: "au-priv",    name: "Privacy Act / SOCI",  region: "AU",   status: "Active",   color: "text-[#9baf9c]",  dot: "bg-[#9baf9c]",
    desc: "Australian Privacy Act APPs + AI Ethics Framework + SOCI critical infrastructure.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function GovernanceDashboard({
  jurisdictions: _,
  assets,
  useCases,
}: {
  jurisdictions: GraphNodeDTO[];
  assets:        GraphNodeDTO[];
  useCases:      GraphNodeDTO[];
}) {
  const [search,   setSearch]   = useState("");
  const [section,  setSection]  = useState<"jurisdictions" | "frameworks">("jurisdictions");

  // Build per-jurisdiction counts from assets/use-cases
  const assetsByJuris: Record<string, number>   = {};
  const ucByJuris:     Record<string, number>   = {};

  for (const asset of assets) {
    const regions = attr<string[]>(asset, "regions") ?? [];
    for (const r of regions) {
      assetsByJuris[r] = (assetsByJuris[r] ?? 0) + 1;
    }
  }
  for (const uc of useCases) {
    const regs = attr<string[]>(uc, "jurisdictions") ?? [];
    for (const j of regs) {
      ucByJuris[j] = (ucByJuris[j] ?? 0) + 1;
    }
  }

  const filtered = ALL_JURIS_CODES.filter((code) => {
    if (!search) return true;
    const name = COUNTRY_NAMES[code] ?? code;
    return name.toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase());
  });

  const totalRegs = FRAMEWORKS.length;
  const activeRegs = FRAMEWORKS.filter((f) => f.status === "Active").length;

  return (
    <div className="space-y-6">

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Jurisdictions tracked", value: ALL_JURIS_CODES.length, sub: "active geographies" },
          { label: "Policy frameworks",     value: totalRegs,            sub: `${activeRegs} in force` },
          { label: "Regulations mapped",    value: FRAMEWORKS.length, sub: "across all frameworks" },
          { label: "AI-specific laws",      value: 5,                    sub: "EU AI Act · NIST · AIDA · GenAI · PL2338" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] p-4">
            <p className="text-[28px] font-black text-[#D9C8B4] leading-none">{value}</p>
            <p className="text-[11.5px] text-[#D9C8B4] font-medium mt-1">{label}</p>
            <p className="text-[10.5px] text-[#5c5248] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Section toggle + search ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center bg-[#161514] border border-[#2a2825] rounded-lg p-0.5 gap-0.5">
          {(["jurisdictions", "frameworks"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors ${
                section === s
                  ? "bg-[#2a2825] text-[#D9C8B4]"
                  : "text-[#5c5248] hover:text-[#9a9078]"
              }`}
            >
              {s === "jurisdictions" ? "Jurisdictions" : "Policy Frameworks"}
            </button>
          ))}
        </div>

        {section === "jurisdictions" && (
          <div className="relative">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5248]" aria-hidden>
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
              <line x1="8.5" y1="8.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jurisdictions…"
              className="pl-8 pr-3 py-1.5 w-52 bg-[#161514] border border-[#2a2825] rounded-lg text-[12.5px] text-[#D9C8B4] placeholder-[#3a3430] focus:outline-none focus:border-[#8A9C8B] transition-colors"
            />
          </div>
        )}
      </div>

      {/* ── Jurisdictions grid ── */}
      {section === "jurisdictions" && (
        filtered.length === 0 ? (
          <p className="text-center text-[12.5px] text-[#5c5248] py-16">No jurisdictions found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((code) => (
              <JurisdictionCard
                key={code}
                code={code}
                assetCount={assetsByJuris[code] ?? 0}
                useCaseCount={ucByJuris[code] ?? 0}
              />
            ))}
          </div>
        )
      )}

      {/* ── Policy frameworks table ── */}
      {section === "frameworks" && (
        <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] overflow-hidden">
          <div className="grid grid-cols-[1fr_60px_90px] border-b border-[#2a2825] px-5 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a3430]">Framework</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a3430]">Region</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a3430]">Status</span>
          </div>
          {FRAMEWORKS.map((f, i) => (
            <div
              key={f.id}
              className={`grid grid-cols-[1fr_60px_90px] px-5 py-3.5 gap-3 ${i < FRAMEWORKS.length - 1 ? "border-b border-[#1e1c1a]" : ""} hover:bg-[#242220] transition-colors`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.dot}`} />
                  <span className="text-[12.5px] font-medium text-[#D9C8B4]">{f.name}</span>
                </div>
                <p className="text-[11px] text-[#5c5248] mt-0.5 pl-3.5">{f.desc}</p>
              </div>
              <span className="text-[11px] font-mono text-[#9a9078] pt-0.5">{f.region}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider pt-0.5 ${f.color}`}>
                {f.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <p className="text-[11px] text-[#3a3430]">
          Jurisdiction mapping is derived from asset regions and use-case data flows.
        </p>
        <Link
          href="/compliance"
          className="text-[11.5px] text-[#8A9C8B] hover:text-[#9baf9c] transition-colors"
        >
          Run compliance analysis →
        </Link>
      </div>
    </div>
  );
}
