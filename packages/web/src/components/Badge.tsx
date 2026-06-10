import React from "react";

// Palette: Sage #8A9C8B · Terracotta #C86F58 · Amber #C4924A · Sand #D9C8B4

type Variant = "sage" | "terra" | "amber" | "sand" | "muted" | "indigo";

const STYLES: Record<Variant, string> = {
  sage:   "bg-[#8A9C8B18] text-[#9baf9c]  border border-[#8A9C8B35]",
  terra:  "bg-[#C86F5818] text-[#d4836e]  border border-[#C86F5835]",
  amber:  "bg-[#C4924A18] text-[#d4a456]  border border-[#C4924A35]",
  sand:   "bg-[#D9C8B410] text-[#c0b09a]  border border-[#D9C8B428]",
  muted:  "bg-[#2e2b2710] text-[#5c5248]  border border-[#2e2b2730]",
  indigo: "bg-[#8A9C8B18] text-[#aec0af]  border border-[#8A9C8B35]",
};

export function Badge({
  label,
  variant = "muted",
  dot = false,
}: {
  label: string;
  variant?: Variant;
  dot?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full text-[11px] font-semibold leading-none ${STYLES[variant]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current opacity-70" />}
      {label}
    </span>
  );
}

// ─── Specialised badges ───────────────────────────────────────────────────────

export function ConfidenceBadge({ confidence }: { confidence: "HIGH" | "MEDIUM" | "LOW" }) {
  const MAP: Record<string, Variant> = { HIGH: "sage", MEDIUM: "amber", LOW: "terra" };
  return <Badge label={confidence} variant={MAP[confidence] ?? "muted"} dot />;
}

export function SourceBadge({ source }: { source: "TELEMETRY" | "MANUAL" }) {
  return (
    <Badge
      label={source === "MANUAL" ? "Manual" : "Telemetry"}
      variant={source === "MANUAL" ? "amber" : "sage"}
      dot={source === "TELEMETRY"}
    />
  );
}

export function NodeTypeBadge({ type }: { type: string }) {
  const VARIANT_MAP: Record<string, Variant> = {
    USE_CASE:    "sage",
    ASSET:       "indigo",
    VENDOR:      "muted",
    DATA_ASSET:  "sand",
    JURISDICTION:"amber",
  };
  const LABEL_MAP: Record<string, string> = {
    USE_CASE:    "Use Case",
    ASSET:       "Asset",
    VENDOR:      "Vendor",
    DATA_ASSET:  "Data Asset",
    JURISDICTION:"Jurisdiction",
  };
  return <Badge label={LABEL_MAP[type] ?? type} variant={VARIANT_MAP[type] ?? "muted"} />;
}
