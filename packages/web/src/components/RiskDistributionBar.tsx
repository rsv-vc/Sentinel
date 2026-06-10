"use client";

import { useEffect, useState } from "react";

type RiskLevel = "CRITICAL" | "HIGH" | "UN_ASSESSED" | "MEDIUM" | "LOW";

// Warm palette risk colors
const COLORS: Record<RiskLevel, { bar: string; label: string; text: string }> = {
  CRITICAL:    { bar: "#C86F58", label: "Critical",    text: "text-[#d4836e]" },
  HIGH:        { bar: "#d4836e", label: "High",        text: "text-[#e0a090]" },
  UN_ASSESSED: { bar: "#9a9078", label: "Unassessed",  text: "text-[#9a9078]" },
  MEDIUM:      { bar: "#C4924A", label: "Medium",      text: "text-[#d4a456]" },
  LOW:         { bar: "#8A9C8B", label: "Low",         text: "text-[#9baf9c]" },
};

const ORDER: RiskLevel[] = ["CRITICAL", "HIGH", "UN_ASSESSED", "MEDIUM", "LOW"];

export function RiskDistributionBar({
  byLevel,
  total,
}: {
  byLevel: Partial<Record<RiskLevel, number>>;
  total: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 80); return () => clearTimeout(t); }, []);

  if (total === 0) {
    return <p className="text-sm text-[#5c5248]">No use-cases scored yet.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-px bg-[#2e2b27]">
        {ORDER.map((level) => {
          const count = byLevel[level] ?? 0;
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={level}
              title={`${COLORS[level].label}: ${count}`}
              style={{
                width:      animated ? `${pct}%` : "0%",
                background: COLORS[level].bar,
                boxShadow:  `0 0 6px ${COLORS[level].bar}55`,
                transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {ORDER.map((level) => {
          const count = byLevel[level] ?? 0;
          if (count === 0) return null;
          return (
            <div key={level} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[level].bar }} />
              <span className={`text-xs ${COLORS[level].text} font-semibold`}>{count}</span>
              <span className="text-xs text-[#5c5248]">{COLORS[level].label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
