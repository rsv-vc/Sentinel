"use client";

import { useState, useMemo } from "react";
import { CostCard } from "@/components/CostCard";
import { OptimizationRecommendationCard } from "@/components/OptimizationRecommendationCard";
import { SEEDED_COSTS, OPTIMIZATION_RECS, calculateCostMetrics, getCostsByBreakdown, getTrendData } from "@/lib/costs";

type BreakdownType = "category" | "tool" | "team";

export function CostsDashboard() {
  const [breakdownType, setBreakdownType] = useState<BreakdownType>("category");

  const metrics = useMemo(() => calculateCostMetrics(SEEDED_COSTS), []);
  const costBreakdown = useMemo(() => getCostsByBreakdown(SEEDED_COSTS, breakdownType), [breakdownType]);
  const trendData = useMemo(() => getTrendData(), []);

  // Create tool ID -> name mapping for recommendations
  const toolMap = Object.fromEntries(SEEDED_COSTS.map((tool) => [tool.toolId, tool.toolName]));

  // Format currency
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  // SVG Trend Chart (12 months)
  const trendMax = Math.max(...trendData.map(d => d.budget));
  const svgHeight = 200;
  const svgWidth = 800;
  const padding = 40;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;

  const points = trendData.map((d, i) => {
    const x = padding + (i / (trendData.length - 1)) * chartWidth;
    const y = padding + chartHeight - (d.cost / trendMax) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const budgetPathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${padding + chartHeight - (p.budget / trendMax) * chartHeight}`).join(" ");

  return (
    <div className="space-y-6">
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <CostCard
          label="Current Month Cost"
          value={fmt(metrics.totalMonthly)}
          subtitle="All tools & services"
          trend={{
            value: metrics.monthOverMonthTrend,
            isPositive: metrics.monthOverMonthTrend > 0,
          }}
        />
        <CostCard
          label="Projected Annual Cost"
          value={fmt(metrics.totalAnnual)}
          subtitle="Current run rate"
          trend={{
            value: (metrics.monthOverMonthTrend * 12) % 100,
            isPositive: false,
          }}
        />
        <CostCard
          label="Potential Savings"
          value={fmt(metrics.potentialSavings)}
          subtitle={`${metrics.savingsPercentage.toFixed(1)}% of monthly spend`}
          trend={{
            value: metrics.savingsPercentage,
            isPositive: true,
          }}
        />
        <CostCard
          label="Cost per Use Case"
          value={fmt(metrics.totalMonthly / 12.5)}
          subtitle="Average per use case"
        />
      </div>

      {/* ── Cost Breakdown Section ── */}
      <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11.5px] text-[#5c5248] font-medium mb-3">BREAKDOWN BY</p>
            <div className="flex items-center gap-2">
              {(["category", "tool", "team"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setBreakdownType(type)}
                  className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors ${
                    breakdownType === type
                      ? "bg-[#8A9C8B] text-white"
                      : "bg-[#242220] text-[#5c5248] hover:text-[#9a9078]"
                  }`}
                >
                  {type === "category" ? "Category" : type === "tool" ? "Tool" : "Team"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal stacked bar chart */}
        <div className="mt-6 space-y-3">
          {costBreakdown.map((item: any) => (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#D9C8B4] font-medium">{item.name}</span>
                <span className="text-[11px] font-bold text-[#9a9078]">{fmt(item.cost)}</span>
              </div>
              <div className="h-3 bg-[#242220] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(item.cost / metrics.totalMonthly) * 100}%`,
                    backgroundColor: item.color || "#8A9C8B",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cost Trends Chart (SVG) ── */}
      <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] p-5">
        <p className="text-[11.5px] text-[#5c5248] font-medium mb-4">MONTHLY COST TREND</p>
        <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={padding + (i / 4) * chartHeight}
              x2={svgWidth - padding}
              y2={padding + (i / 4) * chartHeight}
              stroke="#242220"
              strokeWidth="1"
              strokeDasharray="4"
            />
          ))}

          {/* Budget line */}
          <path d={budgetPathD} stroke="#5c5248" strokeWidth="2" fill="none" strokeDasharray="5 5" />

          {/* Cost line */}
          <path d={pathD} stroke="#8A9C8B" strokeWidth="2.5" fill="none" />

          {/* Data points */}
          {points.map((p, i) => (
            <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="3.5" fill="#8A9C8B" />
          ))}

          {/* X axis */}
          <line x1={padding} y1={padding + chartHeight} x2={svgWidth - padding} y2={padding + chartHeight} stroke="#2a2825" strokeWidth="1.5" />
        </svg>

        {/* Legend */}
        <div className="flex gap-6 mt-4 text-[10px]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-[#8A9C8B]" />
            <span className="text-[#5c5248]">Actual Cost</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-[#5c5248]" style={{ backgroundImage: "repeating-linear-gradient(90deg, #5c5248 0px, #5c5248 5px, transparent 5px, transparent 10px)" }} />
            <span className="text-[#5c5248]">Budget</span>
          </div>
        </div>
      </div>

      {/* ── Cost Breakdown Table ── */}
      <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr] gap-4 border-b border-[#2a2825] px-5 py-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a3430]">Tool</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a3430]">Vendor</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a3430]">Category</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a3430]">Monthly Cost</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a3430]">Utilization</span>
        </div>
        {SEEDED_COSTS.map((tool, i) => (
          <div
            key={tool.toolId}
            className={`grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr] gap-4 px-5 py-3.5 items-center ${
              i < SEEDED_COSTS.length - 1 ? "border-b border-[#1e1c1a]" : ""
            } hover:bg-[#242220] transition-colors`}
          >
            <div>
              <p className="text-[12px] font-medium text-[#D9C8B4]">{tool.toolName}</p>
              <p className="text-[10px] text-[#5c5248] mt-0.5">{tool.team}</p>
            </div>
            <p className="text-[11px] text-[#9a9078]">{tool.vendor}</p>
            <div>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#252220] rounded text-[#5c5248]">{tool.costCategory}</span>
            </div>
            <p className="text-[12px] font-semibold text-[#D9C8B4]">
              {fmt(tool.monthlyCostUsd)}
              <span className="text-[10px] text-[#5c5248]">/mo</span>
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#242220] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    tool.utilizationPercent > 75 ? "bg-[#9baf9c]" : tool.utilizationPercent > 50 ? "bg-[#C4924A]" : "bg-[#d4836e]"
                  }`}
                  style={{ width: `${tool.utilizationPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-[#5c5248] w-10 text-right">{tool.utilizationPercent}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Optimization Recommendations ── */}
      <div>
        <p className="text-[11.5px] text-[#5c5248] font-medium mb-4">OPTIMIZATION OPPORTUNITIES</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {OPTIMIZATION_RECS.map((rec) => (
            <OptimizationRecommendationCard key={rec.id} recommendation={rec} tools={toolMap} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-4">
        <p className="text-[11px] text-[#3a3430]">Cost data updated monthly. Next update scheduled in 3 days.</p>
      </div>
    </div>
  );
}
