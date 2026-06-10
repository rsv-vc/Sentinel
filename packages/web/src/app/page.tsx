import type { Metadata } from "next";
import Link from "next/link";
import {
  serverGetCoverage       as getCoverage,
  serverGetRecentEvents   as getRecentEvents,
  serverGetUseCases       as getUseCases,
  serverGetNodes          as getNodes,
  serverGetPortfolioRisk  as getPortfolioRisk,
  serverGetSyncStatus     as getSyncStatus,
  serverListRectifications as listRectifications,
} from "@/lib/serverApi";
import { Card, CardTitle } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { SyncButton } from "@/components/SyncButton";
import { EstateHealthGauge } from "@/components/EstateHealthGauge";
import { RiskDistributionBar } from "@/components/RiskDistributionBar";
import { LiveSyncTicker } from "@/components/LiveSyncTicker";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ConcentrationBanner } from "@/components/ConcentrationBanner";
import { TopIssuesPanel } from "@/components/TopIssuesPanel";
import { SpendBreakdownChart, DonutChart } from "@/components/SpendBreakdownChart";
import { SenChat } from "@/components/SenChat";
import type { EventDTO } from "@/lib/api";

export const metadata: Metadata = { title: "Dashboard" };

// ─────────────────────────────────────────────────────────────────────────────
// Event grouping (mirrors changes page — groups by SYNC_COMPLETED boundaries)
// ─────────────────────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, { label: string; color: string; icon: string; highlight?: boolean }> = {
  NODE_CREATED:                { label: "New node discovered",    color: "text-[#9baf9c]", icon: "✦", highlight: true },
  NODE_UPDATED:                { label: "Node updated",           color: "text-[#9baf9c]", icon: "↻" },
  NODE_FLAGGED_LOW_CONFIDENCE: { label: "Flagged — needs review", color: "text-[#d4a456]", icon: "⚠", highlight: true },
  NODE_CONFIRMED:              { label: "Node confirmed",         color: "text-[#9baf9c]", icon: "✓" },
  EDGE_CREATED:                { label: "New relationship",       color: "text-[#9baf9c]", icon: "⟶" },
  SYNC_COMPLETED:              { label: "Sync completed",         color: "text-[#5c5248]", icon: "⟳" },
};

interface SyncGroup {
  runLabel:       string;
  events:         EventDTO[];
  newDiscoveries: number;
  flagged:        number;
  nodesUpserted:  number;
  completedAt:    string | null;
}

function groupBySyncRun(events: EventDTO[]): SyncGroup[] {
  const groups: SyncGroup[] = [];
  let current: EventDTO[] = [];
  const ordered = [...events].reverse(); // oldest first

  for (const evt of ordered) {
    if (evt.type === "SYNC_COMPLETED") {
      const payload = evt.payload as Record<string, unknown>;
      groups.push({
        runLabel:      new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        events:        current,
        newDiscoveries: current.filter((e) => e.type === "NODE_CREATED").length,
        flagged:        current.filter((e) => e.type === "NODE_FLAGGED_LOW_CONFIDENCE").length,
        nodesUpserted:  (payload.nodesUpserted as number) ?? 0,
        completedAt:    evt.createdAt,
      });
      current = [];
    } else {
      current.push(evt);
    }
  }
  if (current.length > 0) {
    groups.push({
      runLabel: "In progress…",
      events: current,
      newDiscoveries: current.filter((e) => e.type === "NODE_CREATED").length,
      flagged:        current.filter((e) => e.type === "NODE_FLAGGED_LOW_CONFIDENCE").length,
      nodesUpserted:  0,
      completedAt:    null,
    });
  }
  return groups.reverse(); // most recent first
}

// ─────────────────────────────────────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────────────────────────────────────

async function fetchAll() {
  const [coverage, events, useCases, assets, vendors, dataAssets, portfolio, syncStatus, rects, jurisdictions] =
    await Promise.allSettled([
      getCoverage(),
      getRecentEvents(60),
      getUseCases(),
      getNodes("ASSET"),
      getNodes("VENDOR"),
      getNodes("DATA_ASSET"),
      getPortfolioRisk(),
      getSyncStatus(),
      listRectifications({ status: "OPEN" }),
      getNodes("JURISDICTION"),
    ]);

  return {
    coverage:      coverage.status      === "fulfilled" ? coverage.value          : null,
    events:        events.status        === "fulfilled" ? events.value.data       : [],
    useCases:      useCases.status      === "fulfilled" ? useCases.value.data     : [],
    assets:        assets.status        === "fulfilled" ? assets.value.data       : [],
    vendors:       vendors.status       === "fulfilled" ? vendors.value.data      : [],
    dataAssets:    dataAssets.status    === "fulfilled" ? dataAssets.value.data   : [],
    portfolio:     portfolio.status     === "fulfilled" ? portfolio.value         : null,
    syncStatus:    syncStatus.status    === "fulfilled" ? syncStatus.value        : null,
    openRects:     rects.status         === "fulfilled" ? rects.value.count       : 0,
    jurisdictions: jurisdictions.status === "fulfilled" ? jurisdictions.value.data: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type Attrs = Record<string, unknown>;
function attr<T>(node: { attributes: Record<string, unknown> }, key: string): T | undefined {
  return (node.attributes as Attrs)?.[key] as T | undefined;
}
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ─────────────────────────────────────────────────────────────────────────────
// Nav entry card
// ─────────────────────────────────────────────────────────────────────────────

function NavCard({
  href, icon, title, meta, badge, badgeColor, accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  meta: string;
  badge?: string;
  badgeColor?: string;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-3.5 rounded-xl border border-[#2a2825] bg-[#1e1c1a] hover:border-[#8A9C8B44] hover:bg-[#1e2420] transition-all"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ?? "bg-[#252220]"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-[#D9C8B4] group-hover:text-[#c4d4c5] transition-colors leading-none">{title}</p>
        <p className="text-[10.5px] text-[#5c5248] mt-0.5 truncate">{meta}</p>
      </div>
      {badge && (
        <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${badgeColor}`}>
          {badge}
        </span>
      )}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[#3a3430] group-hover:text-[#8A9C8B] transition-colors flex-shrink-0">
        <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { coverage, events, useCases, assets, vendors, portfolio, syncStatus, openRects, jurisdictions } =
    await fetchAll();

  const score = coverage?.coverageScore ?? 0;

  const software = assets.filter((a) => attr<string>(a, "kind") === "MODEL_DEPLOYMENT");
  const hardware = assets.filter((a) => attr<string>(a, "kind") !== "MODEL_DEPLOYMENT");

  const totalSoftwareSpend = software.reduce((s, a) => s + (attr<number>(a, "monthlyCostUsd") ?? 0), 0);
  const totalHardwareSpend = hardware.reduce((s, a) => s + (attr<number>(a, "monthlyCostUsd") ?? 0), 0);
  const totalMonthly = totalSoftwareSpend + totalHardwareSpend;

  // Top vendors by tool count
  const vendorCounts: Record<string, number> = {};
  software.forEach((a) => {
    const v = attr<string>(a, "vendor") ?? "Unknown";
    vendorCounts[v] = (vendorCounts[v] ?? 0) + 1;
  });

  // Spend by vendor (top 5)
  const vendorSpend: Record<string, number> = {};
  software.forEach((a) => {
    const v = attr<string>(a, "vendor") ?? "Unknown";
    vendorSpend[v] = (vendorSpend[v] ?? 0) + (attr<number>(a, "monthlyCostUsd") ?? 0);
  });
  const topSpendVendors = Object.entries(vendorSpend)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Team breakdown
  const teamCounts: Record<string, number> = {};
  software.forEach((a) => {
    const t = (attr<Attrs>(a, "tags") as Attrs)?.team as string | undefined ?? "other";
    teamCounts[t] = (teamCounts[t] ?? 0) + 1;
  });
  const TEAM_NAMES: Record<string, string> = {
    ops: "Operations", sales: "Sales", product: "Product",
    legal: "Legal", finance: "Finance", "cx-ai": "CX", strategy: "Strategy",
  };
  const teamEntries = Object.entries(teamCounts).sort(([, a], [, b]) => b - a);

  // Top issues
  type Issue = Parameters<typeof TopIssuesPanel>[0]["issues"][number];
  const topIssues: Issue[] = [];
  if (portfolio && portfolio.highOrCritical > 0) {
    topIssues.push({
      kind: "risk", icon: "⚠", badge: "HIGH RISK",
      badgeColor: "text-[#d4836e] bg-[#C86F5818] border border-[#C86F5830]",
      title: `${portfolio.highOrCritical} use-case${portfolio.highOrCritical > 1 ? "s" : ""} at High or Critical risk`,
      subtitle: `${portfolio.unassessed} additional use-case${portfolio.unassessed !== 1 ? "s" : ""} have UN_ASSESSED model behaviour.`,
      href: "/use-cases", cta: "Review",
    });
  } else if (portfolio && portfolio.unassessed > 0) {
    topIssues.push({
      kind: "risk", icon: "◎", badge: "UN_ASSESSED",
      badgeColor: "text-[#9a9078] bg-[#9a907818] border border-[#9a907830]",
      title: `${portfolio.unassessed} use-case${portfolio.unassessed > 1 ? "s" : ""} with UN_ASSESSED model behaviour`,
      subtitle: "Commission adversarial red-teaming and file evidence.",
      href: "/use-cases", cta: "Review",
    });
  }
  if (coverage && coverage.blindSpots.length > 0) {
    topIssues.push({
      kind: "coverage", icon: "◌",
      badge: `${score}% coverage`,
      badgeColor: score >= 80
        ? "text-[#9baf9c] bg-[#8A9C8B18] border border-[#8A9C8B30]"
        : score >= 50 ? "text-[#d4a456] bg-[#C4924A18] border border-[#C4924A30]"
        : "text-[#d4836e] bg-[#C86F5818] border border-[#C86F5830]",
      title: `${coverage.blindSpots.length} blind spot${coverage.blindSpots.length > 1 ? "s" : ""} in estate coverage`,
      subtitle: `Most critical: "${coverage.blindSpots[0].description}"`,
      href: "/coverage", cta: "See full report",
    });
  }
  if (openRects > 0) {
    topIssues.push({
      kind: "compliance", icon: "✗", badge: "OPEN",
      badgeColor: "text-[#d4a456] bg-[#C4924A18] border border-[#C4924A30]",
      title: `${openRects} open rectification action${openRects > 1 ? "s" : ""}`,
      subtitle: "Assign owners, file evidence, and resolve.",
      href: "/rectifications", cta: "Manage",
    });
  }

  const lastSyncAt  = syncStatus?.lastRun?.completedAt ?? null;
  const nextRunAt   = syncStatus?.nextRunAt ?? null;
  const syncGroups  = groupBySyncRun(events);
  const displayGroups = syncGroups.slice(0, 2); // show last 2 sync runs on dashboard

  // ─── Nav icons ─────────────────────────────────────────────────────────────
  const iconProps = { width: 15, height: 15, viewBox: "0 0 14 14", fill: "none" };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        eyebrow="System of Record"
        title="AI Risk Dashboard"
        subtitle={`Independent · Continuous · Evidenced · ${new Date().toLocaleDateString("en-GB", { dateStyle: "long" })}`}
        actions={
          <div className="flex items-center gap-2">
            {/* Rectifications icon button */}
            <Link
              href="/rectifications"
              title="Open rectifications"
              className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-[#2a2825] bg-[#1e1c1a] text-[#5c5248] hover:text-[#d4836e] hover:border-[#C86F5835] hover:bg-[#C86F5808] transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L12.5 3.2V7.5C12.5 10.5 9.5 12.8 7 13.5C4.5 12.8 1.5 10.5 1.5 7.5V3.2L7 1Z"
                  stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M4.5 7l1.8 1.8L9.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {openRects > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[#C86F58] text-white text-[9px] font-bold px-1 leading-none">
                  {openRects > 99 ? "99+" : openRects}
                </span>
              )}
            </Link>
            <SyncButton />
          </div>
        }
      />

      {/* Concentration banner */}
      {portfolio && portfolio.concentrationFlags.length > 0 && (
        <ConcentrationBanner flags={portfolio.concentrationFlags} />
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 1 — Hero 3-col                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Estate health gauge */}
        <Card className="flex flex-col items-center justify-center py-5">
          <EstateHealthGauge score={score} />
          <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t border-[#2a2825]">
            {[
              { label: "Telemetry",   value: coverage?.telemetryNodes          ?? 0, color: "text-[#9baf9c]" },
              { label: "Manual",      value: coverage?.manualNodes             ?? 0, color: "text-[#d4a456]" },
              { label: "Unconfirmed", value: coverage?.unconfirmedLowConfidence ?? 0, color: "text-[#d4836e]" },
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
          <CardTitle>AI Spend</CardTitle>
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
              {portfolio ? (
                <RiskDistributionBar
                  byLevel={portfolio.byLevel as Record<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UN_ASSESSED", number>}
                  total={portfolio.totalUseCases}
                />
              ) : (
                <p className="text-sm text-[#5c5248]">Run a sync to score use-cases.</p>
              )}
            </div>
          </div>
          {portfolio && (
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#2a2825]">
              {[
                { label: "High/Critical", value: portfolio.highOrCritical, color: "text-[#d4836e]" },
                { label: "Unassessed",    value: portfolio.unassessed,     color: "text-[#9baf9c]" },
                { label: "Total",         value: portfolio.totalUseCases,  color: "text-[#D9C8B4]" },
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
          { label: "Software Tools", value: software.length,    color: "text-[#9baf9c]",  href: "/inventory"             },
          { label: "GPU Instances",  value: hardware.length,    color: "text-[#d4a96a]",  href: "/inventory"             },
          { label: "Use Cases",      value: useCases.length,    color: "text-[#c4d4c5]",  href: "/use-cases"             },
          { label: "Vendors",        value: vendors.length,     color: "text-[#d4a456]",  href: "/inventory"             },
          { label: "Jurisdictions",  value: jurisdictions.length, color: "text-[#9a9078]", href: "/compliance"           },
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
            <Link href="/inventory" className="text-[11px] text-[#8A9C8B] hover:text-[#9baf9c] transition-colors">View all →</Link>
          </div>
          <SpendBreakdownChart
            total={totalSoftwareSpend}
            bars={topSpendVendors.map(([vendor, spend], i) => ({
              label: vendor,
              value: spend,
              sublabel: `${vendorCounts[vendor] ?? 0} tool${(vendorCounts[vendor] ?? 0) > 1 ? "s" : ""}`,
              color: ["#8A9C8B", "#9baf9c", "#7a8c7b", "#C4924A", "#d4a96a"][i] ?? "#5c5248",
            }))}
          />
        </Card>

        {/* Team breakdown */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Tools by Team</CardTitle>
            <Link href="/use-cases" className="text-[11px] text-[#8A9C8B] hover:text-[#9baf9c] transition-colors">Use cases →</Link>
          </div>
          <div className="space-y-2.5">
            {teamEntries.map(([team, count], i) => {
              const pct = software.length > 0 ? (count / software.length) * 100 : 0;
              const colors = ["#8A9C8B", "#C4924A", "#9baf9c", "#d4a96a", "#c4d4c5", "#d4a456", "#D9C8B4"];
              const color  = colors[i % colors.length];
              return (
                <div key={team}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-[#D9C8B4]">{TEAM_NAMES[team] ?? team}</span>
                    <span className="text-[11px] text-[#5c5248]">{count} tool{count > 1 ? "s" : ""}</span>
                  </div>
                  <TeamBar pct={pct} color={color} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 4 — Navigation grid                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#3a3430] mb-3 px-1">Quick Access</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <NavCard
            href="/inventory"
            icon={<svg {...iconProps}><circle cx="2" cy="3.5" r="1.1" fill="#9baf9c"/><circle cx="2" cy="7" r="1.1" fill="#9baf9c"/><circle cx="2" cy="10.5" r="1.1" fill="#9baf9c"/><line x1="5" y1="3.5" x2="13" y2="3.5" stroke="#9baf9c" strokeWidth="1.4" strokeLinecap="round"/><line x1="5" y1="7" x2="13" y2="7" stroke="#9baf9c" strokeWidth="1.4" strokeLinecap="round"/><line x1="5" y1="10.5" x2="11" y2="10.5" stroke="#9baf9c" strokeWidth="1.4" strokeLinecap="round"/></svg>}
            title="Inventory"
            meta={`${software.length} software tools · ${hardware.length} GPU instances`}
            accent="bg-[#8A9C8B18]"
          />
          <NavCard
            href="/use-cases"
            icon={<svg {...iconProps}><circle cx="7" cy="7" r="2" stroke="#c4d4c5" strokeWidth="1.3"/><circle cx="2" cy="2.5" r="1.4" stroke="#c4d4c5" strokeWidth="1.2"/><circle cx="12" cy="2.5" r="1.4" stroke="#c4d4c5" strokeWidth="1.2"/><circle cx="7" cy="12.5" r="1.4" stroke="#c4d4c5" strokeWidth="1.2"/><line x1="3.1" y1="3.5" x2="5.8" y2="5.7" stroke="#c4d4c5" strokeWidth="1.1" strokeLinecap="round"/><line x1="10.9" y1="3.5" x2="8.2" y2="5.7" stroke="#c4d4c5" strokeWidth="1.1" strokeLinecap="round"/><line x1="7" y1="9" x2="7" y2="11" stroke="#c4d4c5" strokeWidth="1.1" strokeLinecap="round"/></svg>}
            title="Use Cases"
            meta={`${useCases.length} use cases mapped`}
            badge={portfolio?.highOrCritical ? `${portfolio.highOrCritical} at risk` : undefined}
            badgeColor="text-[#d4836e] bg-[#C86F5812] border-[#C86F5830]"
            accent="bg-[#8A9C8B0A]"
          />
          <NavCard
            href="/coverage"
            icon={<svg {...iconProps}><path d="M7 1L12.5 3.2V7.5C12.5 10.5 9.5 12.8 7 13.5C4.5 12.8 1.5 10.5 1.5 7.5V3.2L7 1Z" stroke="#8A9C8B" strokeWidth="1.3" strokeLinejoin="round"/><path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="#8A9C8B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            title="Coverage"
            meta={`${score}% estate coverage score`}
            badge={coverage?.blindSpots.length ? `${coverage.blindSpots.length} blind spots` : "Good"}
            badgeColor={coverage?.blindSpots.length
              ? "text-[#d4a456] bg-[#C4924A12] border-[#C4924A30]"
              : "text-[#9baf9c] bg-[#8A9C8B12] border-[#8A9C8B30]"}
            accent="bg-[#8A9C8B18]"
          />
          <NavCard
            href="/compliance"
            icon={<svg {...iconProps}><circle cx="7" cy="7" r="5.5" stroke="#9a9078" strokeWidth="1.3"/><ellipse cx="7" cy="7" rx="2.5" ry="5.5" stroke="#9a9078" strokeWidth="1.2"/><line x1="1.5" y1="5" x2="12.5" y2="5" stroke="#9a9078" strokeWidth="1.2" strokeLinecap="round"/><line x1="1.5" y1="9" x2="12.5" y2="9" stroke="#9a9078" strokeWidth="1.2" strokeLinecap="round"/></svg>}
            title="Compliance"
            meta={`${jurisdictions.length} jurisdiction${jurisdictions.length !== 1 ? "s" : ""} detected`}
            accent="bg-[#9a907810]"
          />
          <NavCard
            href="/rectifications"
            icon={<svg {...iconProps}><circle cx="7" cy="7" r="5.5" stroke={openRects > 0 ? "#d4a456" : "#8A9C8B"} strokeWidth="1.3"/><path d="M4.5 7L6.2 8.8L9.5 5.5" stroke={openRects > 0 ? "#d4a456" : "#8A9C8B"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            title="Rectifications"
            meta={openRects > 0 ? `${openRects} open action${openRects > 1 ? "s" : ""} require attention` : "No open actions"}
            badge={openRects > 0 ? `${openRects} open` : undefined}
            badgeColor="text-[#d4a456] bg-[#C4924A12] border-[#C4924A30]"
            accent={openRects > 0 ? "bg-[#C4924A12]" : "bg-[#8A9C8B18]"}
          />
          <NavCard
            href="/reports"
            icon={<svg {...iconProps}><path d="M2.5 1.5h6L12 5v7.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V2a.5.5 0 01.5-.5z" stroke="#D9C8B4" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8.5 1.5V5H12" stroke="#D9C8B4" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><line x1="4" y1="7.5" x2="10" y2="7.5" stroke="#D9C8B4" strokeWidth="1.2" strokeLinecap="round"/><line x1="4" y1="9.8" x2="8" y2="9.8" stroke="#D9C8B4" strokeWidth="1.2" strokeLinecap="round"/></svg>}
            title="Board Report"
            meta="Export board-ready risk summary"
            accent="bg-[#D9C8B408]"
          />
          <NavCard
            href="/changes"
            icon={<svg {...iconProps}><path d="M0.5 7h2.3l1.8-4.5 2.8 8.5 1.9-6.5L11 7h2.5" stroke="#C4924A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            title="Live Changes"
            meta="Real-time event feed"
            accent="bg-[#C4924A0A]"
          />
          <NavCard
            href="/inventory"
            icon={<svg {...iconProps}><rect x="1" y="1" width="5" height="5" rx="1.2" fill="#d4a96a"/><rect x="8" y="1" width="5" height="5" rx="1.2" fill="#d4a96a"/><rect x="1" y="8" width="5" height="5" rx="1.2" fill="#d4a96a"/><rect x="8" y="8" width="5" height="5" rx="1.2" fill="#d4a96a"/></svg>}
            title="Hardware Assets"
            meta={`${hardware.length} GPU instances · ${fmt(totalHardwareSpend)}/mo`}
            accent="bg-[#C4924A0A]"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 5 — Top issues + Sync status                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top Issues */}
        <Card>
          <CardTitle>Top Issues</CardTitle>
          <TopIssuesPanel issues={topIssues.slice(0, 3)} />
        </Card>

        {/* Sync status */}
        <Card>
          <CardTitle>Continuous Sync</CardTitle>
          {syncStatus ? (
            <div className="space-y-3 mt-2">
              <LiveSyncTicker
                running={syncStatus.running}
                lastSyncAt={lastSyncAt}
                nextRunAt={nextRunAt}
                totalRuns={syncStatus.totalRuns}
                intervalMs={syncStatus.intervalMs}
              />
              {syncStatus.connectors.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-[11.5px] bg-[#252220] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.status === "syncing" ? "bg-[#C4924A] animate-pulse" : "bg-[#8A9C8B]"}`} />
                    <span className="text-[#D9C8B4] font-medium truncate max-w-[160px]">{c.name}</span>
                  </div>
                  <span className="text-[#5c5248] text-[10.5px]">Run #{c.currentRun}</span>
                </div>
              ))}
              <div className="pt-1 flex gap-2">
                <SyncButton />
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#5c5248] mt-2">Sync status unavailable — ensure the API is running.</p>
          )}
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 6 — Live Changes (grouped by sync run, click-through to full)   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2825] bg-[#211f1d]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${syncStatus?.running ? "bg-[#C4924A] animate-pulse" : "bg-[#8A9C8B]"}`} />
              <span className="text-[13px] font-semibold text-[#D9C8B4]">Live Changes</span>
            </div>
            {syncStatus && (
              <span className="text-[11px] text-[#5c5248]">
                {syncStatus.totalRuns} sync run{syncStatus.totalRuns !== 1 ? "s" : ""} · every {syncStatus.intervalMs / 1000}s
              </span>
            )}
          </div>
          <Link
            href="/changes"
            className="flex items-center gap-1.5 text-[11.5px] text-[#8A9C8B] hover:text-[#9baf9c] transition-colors group"
          >
            View full feed
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="group-hover:translate-x-0.5 transition-transform">
              <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* No events */}
        {displayGroups.length === 0 && (
          <p className="text-[12.5px] text-[#5c5248] px-5 py-6 text-center">
            No sync runs yet — the scheduler will populate this automatically.
          </p>
        )}

        {/* Sync run groups */}
        {displayGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "border-t border-[#2a2825]" : ""}>
            {/* Run header */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-[#1a1918]">
              <div className="flex items-center gap-2">
                <span className="text-[#5c5248] text-xs">⟳</span>
                <span className="text-[11.5px] font-semibold text-[#9a9078]">
                  Sync run — {group.runLabel}
                </span>
                {group.nodesUpserted > 0 && (
                  <span className="text-[10.5px] text-[#5c5248]">
                    {group.nodesUpserted} nodes · {group.events.length} event{group.events.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {group.newDiscoveries > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#8A9C8B18] text-[#9baf9c] border border-[#8A9C8B30]">
                    +{group.newDiscoveries} new
                  </span>
                )}
                {group.flagged > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#C4924A18] text-[#d4a456] border border-[#C4924A30]">
                    {group.flagged} flagged
                  </span>
                )}
              </div>
            </div>

            {/* Events in run — capped at 8 per group on dashboard */}
            {group.events.length === 0 ? (
              <p className="text-[11.5px] text-[#3a3430] px-5 py-3">No node changes in this run.</p>
            ) : (
              <div className="divide-y divide-[#252220]">
                {group.events.slice(0, 8).map((evt) => {
                  const cfg = EVENT_CONFIG[evt.type] ?? { label: evt.type, color: "text-[#9a9078]", icon: "·", highlight: false };
                  return (
                    <div
                      key={evt.id}
                      className={`flex items-center gap-3 px-5 py-2 text-[11.5px] ${cfg.highlight ? "bg-[#1e211f]" : ""}`}
                    >
                      <span className={`${cfg.color} flex-shrink-0 w-4 text-center text-[12px]`}>{cfg.icon}</span>
                      <span className={`${cfg.color} font-medium w-40 flex-shrink-0`}>{cfg.label}</span>
                      {evt.nodeId ? (
                        <Link
                          href={`/nodes/${encodeURIComponent(evt.nodeId)}`}
                          className="text-[#5c5248] hover:text-[#8A9C8B] font-mono text-[10.5px] truncate flex-1 hover:underline"
                        >
                          {evt.nodeId}
                        </Link>
                      ) : (
                        <span className="flex-1 text-[#3a3430] text-[10.5px]">—</span>
                      )}
                      <span className="text-[#3a3430] flex-shrink-0 text-[10.5px] font-mono">
                        {new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
                {group.events.length > 8 && (
                  <div className="px-5 py-2.5 text-center">
                    <Link href="/changes" className="text-[11px] text-[#5c5248] hover:text-[#9baf9c] transition-colors">
                      +{group.events.length - 8} more events in this run → View full feed
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Footer link */}
        {syncGroups.length > 2 && (
          <div className="border-t border-[#2a2825] px-5 py-3 flex items-center justify-between bg-[#1a1918]">
            <span className="text-[11px] text-[#3a3430]">
              Showing {displayGroups.length} of {syncGroups.length} sync runs
            </span>
            <Link href="/changes" className="text-[11.5px] text-[#8A9C8B] hover:text-[#9baf9c] transition-colors">
              View all {syncGroups.length} runs →
            </Link>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Disclaimer                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {coverage && (
        <div className="flex gap-3 p-3.5 rounded-xl border border-[#2a2825] bg-[#1e1c1a]">
          <span className="text-[#3a3430] text-sm flex-shrink-0">ℹ</span>
          <p className="text-[10.5px] text-[#3a3430] leading-relaxed">{coverage.disclaimer}</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Sen floating chatbot                                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <SenChat />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Team bar (animated)
// ─────────────────────────────────────────────────────────────────────────────

function TeamBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 bg-[#2a2825] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: color,
          boxShadow: `0 0 6px ${color}44`,
          transition: "width 0.7s ease-out",
        }}
      />
    </div>
  );
}
