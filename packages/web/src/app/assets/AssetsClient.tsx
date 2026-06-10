"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { GraphNodeDTO } from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────────────────────────────────────

type Attrs = Record<string, unknown>;
type AssetFilter = "all" | "software" | "hardware";

function attr<T>(node: GraphNodeDTO, key: string): T | undefined {
  return (node.attributes as Attrs)?.[key] as T | undefined;
}

function nodeHref(node: GraphNodeDTO) {
  return `/nodes/${encodeURIComponent(node.id)}`;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing badge
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
// Software card
// ─────────────────────────────────────────────────────────────────────────────

function SoftwareCard({ node }: { node: GraphNodeDTO }) {
  const vendor        = attr<string>(node, "vendor");
  const monthlyCost   = attr<number>(node, "monthlyCostUsd");
  const tags          = attr<Attrs>(node, "tags");
  const pricePerSeat  = tags?.pricePerSeat as string | undefined;
  const planName      = tags?.planName     as string | undefined;
  const pricing       = tags?.pricing      as string | undefined;
  const seats         = tags?.seats        as number | undefined;
  const useCaseLabels = attr<string[]>(node, "useCaseLabels") ?? [];

  return (
    <Link
      href={nodeHref(node)}
      className="flex flex-col gap-2 p-4 rounded-xl border border-[#2a2825] bg-[#1e1c1a] hover:border-[#8A9C8B35] hover:bg-[#1e2420] transition-all group"
    >
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

      {useCaseLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {useCaseLabels.map((l) => (
            <span key={l} className="text-[10px] text-[#7a8a7b] bg-[#1e2420] border border-[#2a3428] rounded-md px-1.5 py-0.5">
              {l}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-[#242220] mt-auto">
        <div className="flex items-center gap-3">
          {pricePerSeat && (
            <div>
              <span className="text-[16px] font-bold text-[#D9C8B4]">${pricePerSeat}</span>
              <span className="text-[10.5px] text-[#5c5248] ml-1">/ seat / mo</span>
            </div>
          )}
          {seats && <span className="text-[10.5px] text-[#5c5248]">{seats} seats</span>}
        </div>
        <div className="text-right">
          {monthlyCost != null && (
            <p className="text-[11.5px] font-semibold text-[#9a9078]">{fmt(monthlyCost)}<span className="text-[#5c5248] font-normal">/mo</span></p>
          )}
          {planName && <p className="text-[10px] text-[#3a3430] mt-0.5">{planName} plan</p>}
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
// Add Tool Modal
// ─────────────────────────────────────────────────────────────────────────────

const TEAM_OPTIONS = ["Operations", "Sales", "Product", "Legal", "Finance", "Customer Experience", "Strategy"];
const STATUS_OPTIONS = ["Active", "Under Review", "Inactive"];
const CATEGORY_OPTIONS = [
  "Writing & Content", "Code Generation", "Data Analysis", "Customer Support",
  "Image Generation", "Meetings & Notes", "Search & Research", "Productivity",
  "Legal & Compliance", "Finance & Reporting", "HR & Recruitment", "Strategy & Planning",
];

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11.5px] font-medium text-[#9a9078] mb-1.5">
        {label}{required && <span className="text-[#d4836e] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 bg-[#161514] border border-[#2a2825] rounded-lg text-[12.5px] text-[#D9C8B4] placeholder-[#3a3430] focus:outline-none focus:border-[#8A9C8B] transition-colors";
const selectCls = inputCls + " appearance-none cursor-pointer";

type AddToolState = {
  name: string;
  assetType: "software" | "hardware";
  vendor: string;
  category: string;
  team: string;
  status: string;
  description: string;
  // software
  planName: string;
  pricePerSeat: string;
  seats: string;
  // hardware
  region: string;
  vramGb: string;
  vcpu: string;
  pricePerHour: string;
};

const EMPTY: AddToolState = {
  name: "", assetType: "software", vendor: "", category: "", team: "", status: "Active",
  description: "", planName: "", pricePerSeat: "", seats: "",
  region: "", vramGb: "", vcpu: "", pricePerHour: "",
};

function AddToolModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<AddToolState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);

  function set(key: keyof AddToolState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        <div
          className="relative z-10 w-full max-w-md bg-[#1e1c1a] border border-[#2a2825] rounded-2xl shadow-2xl shadow-black/80 p-8 flex flex-col items-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-full bg-[#1e2420] border border-[#2a3428] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10l4.5 4.5L16 6" stroke="#9baf9c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[14px] font-semibold text-[#D9C8B4]">Tool added for review</p>
            <p className="text-[12px] text-[#5c5248] mt-1">
              <span className="text-[#9a9078] font-medium">{form.name}</span> has been submitted and will appear once verified.
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-2 px-5 py-2 rounded-lg bg-[#8A9C8B] text-[#1a1918] text-[12.5px] font-semibold hover:bg-[#9baf9c] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div
        className="relative z-10 w-full max-w-xl bg-[#1e1c1a] border border-[#2a2825] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2825]">
          <div>
            <h2 className="text-[14px] font-semibold text-[#D9C8B4]">Add Tool</h2>
            <p className="text-[11px] text-[#5c5248] mt-0.5">New asset will be queued for verification</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#5c5248] hover:text-[#9a9078] transition-colors p-1.5 rounded-md hover:bg-[#2a2825]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">

            {/* Asset type toggle */}
            <FormField label="Asset type" required>
              <div className="flex gap-2">
                {(["software", "hardware"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("assetType", t)}
                    className={`flex-1 py-2 rounded-lg text-[12.5px] font-medium transition-colors border ${
                      form.assetType === t
                        ? t === "software"
                          ? "bg-[#1e2420] border-[#8A9C8B55] text-[#c4d4c5]"
                          : "bg-[#1f1c19] border-[#C4924A55] text-[#d4a96a]"
                        : "border-[#2a2825] text-[#5c5248] hover:text-[#9a9078] hover:border-[#3a3835]"
                    }`}
                  >
                    {t === "software" ? "💻  Software" : "🖥️  Hardware"}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Common fields */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tool name" required>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Notion AI"
                  className={inputCls}
                />
              </FormField>
              <FormField label="Vendor" required>
                <input
                  required
                  type="text"
                  value={form.vendor}
                  onChange={(e) => set("vendor", e.target.value)}
                  placeholder="e.g. Notion Labs"
                  className={inputCls}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Category / Use case">
                <select value={form.category} onChange={(e) => set("category", e.target.value)} className={selectCls}>
                  <option value="">Select category…</option>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Team">
                <select value={form.team} onChange={(e) => set("team", e.target.value)} className={selectCls}>
                  <option value="">Select team…</option>
                  {TEAM_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
            </div>

            {/* Software-specific */}
            {form.assetType === "software" && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 border-t border-[#2a2825]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c5248]">Subscription</span>
                  <div className="flex-1 border-t border-[#2a2825]" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <FormField label="Plan name">
                    <input
                      type="text"
                      value={form.planName}
                      onChange={(e) => set("planName", e.target.value)}
                      placeholder="e.g. Business"
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Price / seat / mo ($)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.pricePerSeat}
                      onChange={(e) => set("pricePerSeat", e.target.value)}
                      placeholder="e.g. 16"
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Seat count">
                    <input
                      type="number"
                      min="1"
                      value={form.seats}
                      onChange={(e) => set("seats", e.target.value)}
                      placeholder="e.g. 200"
                      className={inputCls}
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Hardware-specific */}
            {form.assetType === "hardware" && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 border-t border-[#2a2825]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c5248]">Compute specs</span>
                  <div className="flex-1 border-t border-[#2a2825]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Region">
                    <input
                      type="text"
                      value={form.region}
                      onChange={(e) => set("region", e.target.value)}
                      placeholder="e.g. us-east-1"
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Price / hr ($)">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={form.pricePerHour}
                      onChange={(e) => set("pricePerHour", e.target.value)}
                      placeholder="e.g. 3.50"
                      className={inputCls}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="VRAM (GB)">
                    <input
                      type="number"
                      min="0"
                      value={form.vramGb}
                      onChange={(e) => set("vramGb", e.target.value)}
                      placeholder="e.g. 80"
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="vCPU count">
                    <input
                      type="number"
                      min="0"
                      value={form.vcpu}
                      onChange={(e) => set("vcpu", e.target.value)}
                      placeholder="e.g. 96"
                      className={inputCls}
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Status">
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className={selectCls}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
            </div>

            {/* Description */}
            <FormField label="Description">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Brief description of what this tool does and why it's used…"
                className={inputCls + " resize-none"}
              />
            </FormField>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#2a2825] flex items-center justify-between">
            <p className="text-[11px] text-[#3a3430]">Submitted assets are queued for admin verification</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[12.5px] text-[#9a9078] hover:text-[#D9C8B4] border border-[#2a2825] hover:border-[#3a3835] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#8A9C8B] text-[#1a1918] text-[12.5px] font-semibold hover:bg-[#9baf9c] transition-colors disabled:opacity-40"
                disabled={!form.name || !form.vendor}
              >
                Add Tool
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function AssetsClient({ assets }: { assets: GraphNodeDTO[] }) {
  const [filter,    setFilter]    = useState<AssetFilter>("all");
  const [subFilter, setSubFilter] = useState<string>("all");
  const [search,    setSearch]    = useState("");
  const [showAdd,   setShowAdd]   = useState(false);

  const software = useMemo(
    () => assets.filter((a) => attr<string>(a, "kind") === "MODEL_DEPLOYMENT"),
    [assets],
  );
  const hardware = useMemo(
    () => assets.filter((a) => attr<string>(a, "kind") !== "MODEL_DEPLOYMENT"),
    [assets],
  );

  const softwareCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const n of software) {
      (attr<string[]>(n, "useCaseLabels") ?? []).forEach((l) => cats.add(l));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [software, subFilter, search]);

  const filteredHardware = useMemo(() => {
    return hardware.filter((n) => {
      if (!matchSearch(n)) return false;
      if (subFilter === "all") return true;
      return attr<string>(n, "vendor") === subFilter;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hardware, subFilter, search]);

  const totalSoftwareCost = software.reduce((s, n) => s + (attr<number>(n, "monthlyCostUsd") ?? 0), 0);
  const totalHardwareCost = hardware.reduce((s, n) => s + (attr<number>(n, "monthlyCostUsd") ?? 0), 0);

  function changeFilter(f: AssetFilter) {
    setFilter(f);
    setSubFilter("all");
    setSearch("");
  }

  const activeSoftware = filter === "all" ? filteredSoftware : filter === "software" ? filteredSoftware : [];
  const activeHardware = filter === "all" ? filteredHardware : filter === "hardware" ? filteredHardware : [];

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {showAdd && <AddToolModal onClose={() => setShowAdd(false)} />}

      <div className="space-y-5">
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Segment control */}
          <div className="flex items-center bg-[#161514] border border-[#2a2825] rounded-lg p-0.5 gap-0.5">
            {([
              { id: "all",      label: `All`,                 count: assets.length   },
              { id: "software", label: `Software`,            count: software.length },
              { id: "hardware", label: `Hardware`,            count: hardware.length },
            ] as const).map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => changeFilter(id)}
                className={`px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors ${
                  filter === id
                    ? "bg-[#2a2825] text-[#D9C8B4]"
                    : "text-[#5c5248] hover:text-[#9a9078]"
                }`}
              >
                {label}
                <span className={`ml-1.5 text-[10.5px] font-mono ${filter === id ? "text-[#9a9078]" : "text-[#3a3430]"}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Right side: search + add */}
          <div className="flex items-center gap-2.5">
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
                placeholder="Search assets…"
                className="pl-8 pr-3 py-1.5 w-52 bg-[#161514] border border-[#2a2825] rounded-lg text-[12.5px] text-[#D9C8B4] placeholder-[#3a3430] focus:outline-none focus:border-[#8A9C8B] transition-colors"
              />
            </div>
            {/* Add button */}
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8A9C8B] text-[#1a1918] text-[12.5px] font-semibold hover:bg-[#9baf9c] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Add Tool
            </button>
          </div>
        </div>

        {/* ── Spend strip ── */}
        <div className="flex items-center gap-5 px-1 flex-wrap">
          {(filter === "all" || filter === "software") && totalSoftwareCost > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#9baf9c]" />
              <span className="text-[10px] uppercase tracking-wider text-[#5c5248]">Software</span>
              <span className="text-[13px] font-semibold text-[#aec0af]">{fmt(totalSoftwareCost)}/mo</span>
            </div>
          )}
          {(filter === "all" || filter === "hardware") && totalHardwareCost > 0 && (
            <>
              {filter === "all" && <span className="text-[#2a2825] text-xs">|</span>}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#d4a96a]" />
                <span className="text-[10px] uppercase tracking-wider text-[#5c5248]">Hardware</span>
                <span className="text-[13px] font-semibold text-[#d4a96a]">{fmt(totalHardwareCost)}/mo</span>
              </div>
            </>
          )}
          {filter === "all" && (
            <>
              <span className="text-[#2a2825] text-xs">|</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[#5c5248]">Total</span>
                <span className="text-[13px] font-semibold text-[#D9C8B4]">{fmt(totalSoftwareCost + totalHardwareCost)}/mo</span>
              </div>
            </>
          )}
        </div>

        {/* ── Sub-filters ── */}
        {filter === "software" && (
          <div className="flex items-center gap-2 flex-wrap">
            {softwareCategories.map((c) => (
              <button
                key={c}
                onClick={() => setSubFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border whitespace-nowrap ${
                  subFilter === c
                    ? "bg-[#8A9C8B] text-[#1a1918] border-transparent"
                    : "text-[#9a9078] border-[#2a2825] hover:text-[#D9C8B4] hover:border-[#8A9C8B44]"
                }`}
              >
                {c === "all" ? "All categories" : c}
              </button>
            ))}
          </div>
        )}
        {filter === "hardware" && (
          <div className="flex items-center gap-2 flex-wrap">
            {hardwareVendors.map((v) => (
              <button
                key={v}
                onClick={() => setSubFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border whitespace-nowrap ${
                  subFilter === v
                    ? "bg-[#C4924A] text-[#1a1918] border-transparent"
                    : "text-[#9a9078] border-[#2a2825] hover:text-[#D9C8B4] hover:border-[#C4924A44]"
                }`}
              >
                {v === "all" ? "All vendors" : v}
              </button>
            ))}
          </div>
        )}

        {/* ════ Content ════ */}
        <div className="space-y-8">
          {/* Software section */}
          {(filter === "all" || filter === "software") && (
            <div>
              {filter === "all" && (
                <SectionHeader label="Software — AI Tools" count={activeSoftware.length} color="text-[#9baf9c]" />
              )}
              {activeSoftware.length === 0 ? (
                <p className="text-center text-[12.5px] text-[#5c5248] py-10">No software tools match.</p>
              ) : filter === "software" && subFilter === "all" ? (
                // Grouped by category when browsing software
                (() => {
                  const map: Record<string, GraphNodeDTO[]> = {};
                  for (const n of activeSoftware) {
                    const labels = attr<string[]>(n, "useCaseLabels") ?? ["Uncategorised"];
                    const primary = labels[0];
                    if (!map[primary]) map[primary] = [];
                    map[primary].push(n);
                  }
                  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([cat, nodes]) => (
                    <div key={cat} className="mb-6">
                      <SectionHeader label={cat} count={nodes.length} color="text-[#9baf9c]" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {nodes.map((n) => <SoftwareCard key={n.id} node={n} />)}
                      </div>
                    </div>
                  ));
                })()
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeSoftware.map((n) => <SoftwareCard key={n.id} node={n} />)}
                </div>
              )}
            </div>
          )}

          {/* Hardware section */}
          {(filter === "all" || filter === "hardware") && (
            <div>
              {filter === "all" && activeHardware.length > 0 && (
                <SectionHeader label="Hardware — GPU Compute" count={activeHardware.length} color="text-[#d4a96a]" />
              )}
              {activeHardware.length === 0 ? (
                filter === "hardware" && (
                  <p className="text-center text-[12.5px] text-[#5c5248] py-10">No hardware assets match.</p>
                )
              ) : filter === "hardware" && subFilter === "all" ? (
                (() => {
                  const map: Record<string, GraphNodeDTO[]> = {};
                  for (const n of activeHardware) {
                    const v = attr<string>(n, "vendor") ?? "Unknown";
                    if (!map[v]) map[v] = [];
                    map[v].push(n);
                  }
                  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([v, nodes]) => (
                    <div key={v} className="mb-6">
                      <SectionHeader label={v} count={nodes.length} color="text-[#d4a96a]" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {nodes.map((n) => <HardwareCard key={n.id} node={n} />)}
                      </div>
                    </div>
                  ));
                })()
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeHardware.map((n) => <HardwareCard key={n.id} node={n} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
