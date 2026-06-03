import React from "react";

type Variant = "indigo" | "green" | "amber" | "red" | "gray" | "blue";

const styles: Record<Variant, string> = {
  indigo: "bg-[#6366f122] text-[#a5b4fc] border border-[#6366f133]",
  green:  "bg-[#22c55e22] text-[#4ade80]  border border-[#22c55e33]",
  amber:  "bg-[#f59e0b22] text-[#fbbf24]  border border-[#f59e0b33]",
  red:    "bg-[#ef444422] text-[#f87171]   border border-[#ef444433]",
  gray:   "bg-[#5b5b7022] text-[#8b8ba8]  border border-[#5b5b7033]",
  blue:   "bg-[#3b82f622] text-[#93c5fd]  border border-[#3b82f633]",
};

export function Badge({ label, variant = "gray" }: { label: string; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: "HIGH" | "MEDIUM" | "LOW" }) {
  const map: Record<string, Variant> = { HIGH: "green", MEDIUM: "amber", LOW: "red" };
  return <Badge label={confidence} variant={map[confidence] ?? "gray"} />;
}

export function SourceBadge({ source }: { source: "TELEMETRY" | "MANUAL" }) {
  return <Badge label={source === "MANUAL" ? "⚠ Manual" : "Telemetry"} variant={source === "MANUAL" ? "amber" : "indigo"} />;
}

export function NodeTypeBadge({ type }: { type: string }) {
  const map: Record<string, Variant> = {
    USE_CASE: "indigo", ASSET: "blue", VENDOR: "gray",
    DATA_ASSET: "green", JURISDICTION: "amber",
  };
  const labels: Record<string, string> = {
    USE_CASE: "Use Case", ASSET: "Asset", VENDOR: "Vendor",
    DATA_ASSET: "Data Asset", JURISDICTION: "Jurisdiction",
  };
  return <Badge label={labels[type] ?? type} variant={map[type] ?? "gray"} />;
}
