"use client";

import { useState } from "react";
import type { OptimizationRecommendation } from "@/lib/costs";

interface OptimizationCardProps {
  recommendation: OptimizationRecommendation;
  tools: Record<string, string>; // toolId -> toolName mapping
}

export function OptimizationRecommendationCard({ recommendation, tools }: OptimizationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const priorityColors = {
    high: { badge: "bg-[#d4836e]", text: "text-[#d4836e]", label: "High Priority" },
    medium: { badge: "bg-[#C4924A]", text: "text-[#C4924A]", label: "Medium Priority" },
    low: { badge: "bg-[#9baf9c]", text: "text-[#9baf9c]", label: "Low Priority" },
  };

  const typeLabels = {
    consolidation: "Consolidation",
    redundancy: "Redundancy",
    "pricing-strategy": "Pricing Strategy",
  };

  const colors = priorityColors[recommendation.priority];

  return (
    <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${colors.badge} text-white`}>
              {typeLabels[recommendation.type]}
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${colors.text}`}>{colors.label}</span>
          </div>
          <h3 className="text-[13.5px] font-semibold text-[#D9C8B4]">{recommendation.title}</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg border border-[#2a2825] hover:border-[#8A9C8B35] transition-colors"
          aria-label="Toggle details"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d={expanded ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"}
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#5c5248]"
            />
          </svg>
        </button>
      </div>

      {/* Description */}
      <p className="text-[11px] text-[#9a9078] mt-3">{recommendation.description}</p>

      {/* Affected Tools */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {recommendation.affectedTools.map((toolId) => (
          <span
            key={toolId}
            className="text-[9.5px] text-[#5c5248] bg-[#252220] border border-[#2a2825] rounded-md px-2 py-1"
          >
            {tools[toolId] || toolId}
          </span>
        ))}
      </div>

      {/* Savings Highlight */}
      <div className="mt-4 pt-4 border-t border-[#242220]">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-[#5c5248] font-medium">Potential Annual Savings</p>
          <p className="text-[16px] font-black text-[#9baf9c]">
            ${(recommendation.potentialSavingsUsd * 12).toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Implementation Details (Expandable) */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#242220]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c5248] mb-2">Implementation Plan</p>
          <p className="text-[11px] text-[#9a9078] leading-relaxed">{recommendation.implementation}</p>
        </div>
      )}
    </div>
  );
}
