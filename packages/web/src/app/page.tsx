import type { Metadata } from "next";
import Link from "next/link";
import { getCoverage, getRecentEvents, getUseCases, getNodes } from "@/lib/api";
import { Card, CardTitle } from "@/components/Card";
import { SyncButton } from "@/components/SyncButton";

export const metadata: Metadata = { title: "Dashboard" };

async function fetchAll() {
  const [coverage, events, useCases, assets] = await Promise.allSettled([
    getCoverage(),
    getRecentEvents(10),
    getUseCases(),
    getNodes("ASSET"),
  ]);
  return {
    coverage: coverage.status === "fulfilled" ? coverage.value : null,
    events:   events.status   === "fulfilled" ? events.value.data   : [],
    useCases: useCases.status === "fulfilled" ? useCases.value.data : [],
    assets:   assets.status   === "fulfilled" ? assets.value.data   : [],
  };
}

export default async function DashboardPage() {
  const { coverage, events, useCases, assets } = await fetchAll();

  const score = coverage?.coverageScore ?? 0;
  const scoreColor =
    score >= 80 ? "text-[#4ade80]" :
    score >= 50 ? "text-[#fbbf24]" :
    "text-[#f87171]";
  const scoreBg =
    score >= 80 ? "from-[#22c55e22]" :
    score >= 50 ? "from-[#f59e0b22]" :
    "from-[#ef444422]";

  const unconfirmed = coverage?.unconfirmedLowConfidence ?? 0;
  const totalMonthly = assets.reduce((sum, a) => {
    const cost = (a.attributes as Record<string, unknown>)?.monthlyCostUsd;
    return sum + (typeof cost === "number" ? cost : 0);
  }, 0);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#6366f1] font-semibold uppercase tracking-widest mb-1">
            System of Record
          </p>
          <h1 className="text-3xl font-bold text-[#e4e4f0]">AI Risk Dashboard</h1>
          <p className="text-[#8b8ba8] mt-1 text-sm">
            Independent, continuous monitoring · {new Date().toLocaleDateString("en-GB", { dateStyle: "long" })}
          </p>
        </div>
        <SyncButton />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Coverage score */}
        <Card className={`bg-gradient-to-br ${scoreBg} to-transparent lg:col-span-1`}>
          <CardTitle>Coverage Score</CardTitle>
          <div className={`text-5xl font-black ${scoreColor}`}>{score}%</div>
          <p className="text-xs text-[#5b5b70] mt-2">of registered estate observed via telemetry</p>
        </Card>

        {/* Use cases */}
        <Card>
          <CardTitle>Use Cases</CardTitle>
          <div className="text-4xl font-black text-[#e4e4f0]">{useCases.length}</div>
          <Link href="/use-cases" className="text-xs text-[#6366f1] hover:text-[#818cf8] mt-2 block">
            View all →
          </Link>
        </Card>

        {/* Unconfirmed */}
        <Card className={unconfirmed > 0 ? "border-[#f59e0b44]" : ""}>
          <CardTitle>Needs Confirmation</CardTitle>
          <div className={`text-4xl font-black ${unconfirmed > 0 ? "text-[#fbbf24]" : "text-[#e4e4f0]"}`}>
            {unconfirmed}
          </div>
          {unconfirmed > 0 && (
            <Link href="/inventory?filter=low" className="text-xs text-[#fbbf24] hover:text-[#fde68a] mt-2 block">
              Review low-confidence →
            </Link>
          )}
        </Card>

        {/* Monthly AI spend */}
        <Card>
          <CardTitle>Observed AI Spend</CardTitle>
          <div className="text-4xl font-black text-[#e4e4f0]">
            ${(totalMonthly / 1000).toFixed(0)}k
          </div>
          <p className="text-xs text-[#5b5b70] mt-2">per month, from connected sources</p>
        </Card>
      </div>

      {/* Coverage disclaimer — Principle 3: always visible */}
      {coverage && (
        <div className="flex gap-3 p-4 rounded-xl border border-[#f59e0b33] bg-[#f59e0b0a]">
          <span className="text-[#fbbf24] text-lg flex-shrink-0">⚠</span>
          <p className="text-xs text-[#8b8ba8] leading-relaxed">{coverage.disclaimer}</p>
        </div>
      )}

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Blind spots */}
        <Card>
          <CardTitle>Known Blind Spots ({coverage?.blindSpots.length ?? 0})</CardTitle>
          {!coverage || coverage.blindSpots.length === 0 ? (
            <p className="text-sm text-[#5b5b70]">No blind spots detected in current estate.</p>
          ) : (
            <ul className="space-y-2">
              {coverage.blindSpots.slice(0, 6).map((bs, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-[#f87171] flex-shrink-0 mt-0.5">·</span>
                  <span className="text-[#8b8ba8]">{bs.description}</span>
                </li>
              ))}
              {coverage.blindSpots.length > 6 && (
                <li className="text-xs text-[#5b5b70]">
                  +{coverage.blindSpots.length - 6} more —{" "}
                  <Link href="/coverage" className="text-[#6366f1] hover:underline">see full report</Link>
                </li>
              )}
            </ul>
          )}
        </Card>

        {/* Recent events */}
        <Card>
          <CardTitle>Recent Events</CardTitle>
          {events.length === 0 ? (
            <p className="text-sm text-[#5b5b70]">No events yet. Run a sync to populate the graph.</p>
          ) : (
            <ul className="space-y-2">
              {events.map((e) => (
                <li key={e.id} className="flex items-start gap-3 text-sm">
                  <span className="text-[#5b5b70] text-xs pt-0.5 flex-shrink-0">
                    {new Date(e.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-[#8b8ba8]">
                    <span className="text-[#a5b4fc] font-medium">{e.type.replace(/_/g, " ")}</span>
                    {e.nodeId && (
                      <Link
                        href={`/nodes/${e.nodeId}`}
                        className="ml-1 text-[#6366f1] hover:underline text-xs"
                      >
                        {e.nodeId.slice(0, 16)}…
                      </Link>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/inventory" className="px-4 py-2 rounded-lg border border-[#2a2a38] text-sm text-[#8b8ba8] hover:text-[#e4e4f0] hover:border-[#6366f1] transition-colors">
          Browse Inventory
        </Link>
        <Link href="/use-cases" className="px-4 py-2 rounded-lg border border-[#2a2a38] text-sm text-[#8b8ba8] hover:text-[#e4e4f0] hover:border-[#6366f1] transition-colors">
          View Use Cases
        </Link>
        <Link href="/coverage" className="px-4 py-2 rounded-lg border border-[#2a2a38] text-sm text-[#8b8ba8] hover:text-[#e4e4f0] hover:border-[#6366f1] transition-colors">
          Full Coverage Report
        </Link>
      </div>
    </div>
  );
}
