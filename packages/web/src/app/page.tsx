import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardTitle } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { EstateHealthGauge } from "@/components/EstateHealthGauge";
import { RiskDistributionBar } from "@/components/RiskDistributionBar";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ConcentrationBanner } from "@/components/ConcentrationBanner";
import { TopIssuesPanel } from "@/components/TopIssuesPanel";
import { SpendBreakdownChart, DonutChart } from "@/components/SpendBreakdownChart";

export const metadata: Metadata = { title: "Dashboard" };

// Mock data
const fmt = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const mockData = {
  coverage: {
    score: 62,
    totalNodes: 94,
    telemetryNodes: 94,
    manualNodes: 0,
    unconfirmedLowConfidence: 4,
  },
  portfolio: {
    totalUseCases: 12,
    highOrCritical: 2,
    unassessed: 4,
    byLevel: {
      CRITICAL: 0,
      HIGH: 2,
      MEDIUM: 4,
      LOW: 2,
      UN_ASSESSED: 4,
    },
    concentrationFlags: [
      { vendorId: "anthropic", vendorLabel: "Anthropic", useCaseCount: 5, portfolioShare: 42 },
      { vendorId: "openai", vendorLabel: "OpenAI", useCaseCount: 4, portfolioShare: 33 },
    ],
  },
  spend: {
    totalMonthly: 16197,
    software: 7900,
    hardware: 13700,
    topVendors: [
      ["Anthropic", 5800],
      ["OpenAI", 4200],
      ["AWS", 3600],
      ["Google Cloud", 2400],
    ],
  },
  rectifications: 3,
};

export default function DashboardPage() {
  const totalSoftwareSpend = mockData.spend.software;
  const totalHardwareSpend = mockData.spend.hardware;
  const totalMonthly = mockData.spend.totalMonthly;
  const software = Array(12).fill(null).map((_, i) => ({ id: `sw${i}`, label: `Tool ${i + 1}` }));
  const vendors = Array(5).fill(null).map((_, i) => ({ id: `v${i}`, label: `Vendor ${i + 1}` }));
  const useCases = Array(12).fill(null).map((_, i) => ({ id: `uc${i}`, label: `Use Case ${i + 1}` }));
  const openRects = mockData.rectifications;

  const topSpendVendors = mockData.spend.topVendors;
  const vendorCounts = Object.fromEntries(topSpendVendors.map(([v]) => [v, 2]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Risk Dashboard"
        subtitle="Estate health, risk distribution, AI spend, and open actions"
        actions={
          <div className="flex items-center gap-2">
            {openRects > 0 && (
              <Link
                href="/rectifications"
                className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-[#d4836e] hover:bg-[#c86f58] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M7 1L12.5 3.2V7.5C12.5 10.5 9.5 12.8 7 13.5C4.5 12.8 1.5 10.5 1.5 7.5V3.2L7 1Z"
                    stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                </svg>
                Rectifications
                {openRects > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-[9px] font-bold px-1 rounded-full bg-[#C86F58] text-white">
                    {openRects}
                  </span>
                )}
              </Link>
            )}
          </div>
        }
      />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 1 — Estate Health, AI Spend, Risk Distribution                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Estate Health Gauge */}
        <Card>
          <CardTitle>Estate Health</CardTitle>
          <div className="mt-4">
            <EstateHealthGauge score={mockData.coverage.score} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            {[
              { label: "Confirmed", value: mockData.coverage.totalNodes - mockData.coverage.unconfirmedLowConfidence, color: "text-[#9baf9c]" },
              { label: "Unconfirmed", value: mockData.coverage.unconfirmedLowConfidence, color: "text-[#d4836e]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <AnimatedNumber value={value} className={`text-lg font-black ${color}`} />
                <p className="text-[10px] text-[#5c5248] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Spend donut + breakdown */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>AI Spend</CardTitle>
            <Link href="/finance" className="text-[11px] text-[#8A9C8B] hover:text-[#9baf9c] transition-colors">View details →</Link>
          </div>
          <div className="mt-3">
            <DonutChart
              centerLabel={`$${Math.round(totalMonthly / 1000)}k`}
              centerSub="per month"
              segments={[
                { label: "Software tools", value: totalSoftwareSpend, color: "#8A9C8B" },
                { label: "GPU compute",    value: totalHardwareSpend, color: "#C4924A" },
              ]}
            />
          </div>
          <div className="mt-3 pt-3 border-t border-[#2a2825] grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-[16px] font-black text-[#9baf9c]">{fmt(totalSoftwareSpend)}</p>
              <p className="text-[10px] text-[#5c5248]">Software / mo</p>
            </div>
            <div>
              <p className="text-[16px] font-black text-[#d4a96a]">{fmt(totalHardwareSpend)}</p>
              <p className="text-[10px] text-[#5c5248]">Hardware / mo</p>
            </div>
          </div>
        </Card>

        {/* Risk distribution */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardTitle>Risk Distribution</CardTitle>
            <div className="mt-3">
              <RiskDistributionBar
                byLevel={mockData.portfolio.byLevel}
                total={mockData.portfolio.totalUseCases}
              />
            </div>
          </div>
          {mockData.portfolio && (
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#2a2825]">
              {[
                { label: "High/Critical", value: mockData.portfolio.highOrCritical, color: "text-[#d4836e]" },
                { label: "Unassessed",    value: mockData.portfolio.unassessed,     color: "text-[#9baf9c]" },
                { label: "Total",         value: mockData.portfolio.totalUseCases,  color: "text-[#D9C8B4]" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <AnimatedNumber value={value} className={`text-lg font-black ${color}`} />
                  <p className="text-[10px] text-[#5c5248] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 2 — KPI strip                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Software Tools", value: software.length,    color: "text-[#9baf9c]",  href: "/assets" },
          { label: "GPU Instances",  value: 2,                  color: "text-[#d4a96a]",  href: "/assets" },
          { label: "Use Cases",      value: useCases.length,    color: "text-[#c4d4c5]",  href: "/use-cases" },
          { label: "Vendors",        value: vendors.length,     color: "text-[#d4a456]",  href: "/vendors" },
          { label: "Jurisdictions",  value: 10,                 color: "text-[#9a9078]",  href: "/governance" },
          { label: "Open Actions",   value: openRects,          color: openRects > 0 ? "text-[#d4a456]" : "text-[#D9C8B4]", href: "/rectifications" },
        ].map(({ label, value, color, href }) => (
          <Link key={label} href={href}
            className="bg-[#1e1c1a] border border-[#2a2825] rounded-xl p-4 hover:border-[#8A9C8B44] hover:bg-[#1e2420] transition-all group text-center">
            <AnimatedNumber value={value} className={`text-2xl font-black ${color} group-hover:scale-110 transition-transform inline-block`} />
            <p className="text-[10.5px] text-[#5c5248] mt-1 uppercase tracking-wide">{label}</p>
          </Link>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 3 — Vendor spend + Team breakdown                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vendor spend chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Top Vendor Spend</CardTitle>
            <Link href="/vendors" className="text-[11px] text-[#8A9C8B] hover:text-[#9baf9c] transition-colors">View all →</Link>
          </div>
          <SpendBreakdownChart
            total={totalSoftwareSpend}
            bars={topSpendVendors.map(([vendor, spend], i) => ({
              label: vendor,
              value: spend as number,
              sublabel: `${vendorCounts[vendor] ?? 0} tools`,
              color: ["#8A9C8B", "#9baf9c", "#7a8c7b", "#C4924A", "#d4a96a"][i] ?? "#5c5248",
            }))}
          />
        </Card>

        {/* Concentration banner */}
        <div className="space-y-3">
          <ConcentrationBanner flags={mockData.portfolio.concentrationFlags} />
          <Card>
            <CardTitle className="text-sm">Next Actions</CardTitle>
            <ul className="space-y-2 mt-3 text-sm text-[#9a9078]">
              <li>• Review vendor contracts (HIGH priority)</li>
              <li>• Implement model evaluation framework</li>
              <li>• Deploy multi-region failover</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-[#5c5248] pt-4">
        <p>Mock data — Design demo only</p>
        <p>Last sync: Just now</p>
      </div>
    </div>
  );
}
