"use client";

/**
 * Sen — Sentinel GRC AI Assistant
 * A floating chat panel that answers questions about the AI estate using live API data.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  getNodes, getUseCases, getCoverage, getPortfolioRisk, getBoardReport,
} from "@/lib/api";
import type {
  GraphNodeDTO, CoverageReportDTO, PortfolioRiskReportDTO, BoardReportDTO,
} from "@/lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "sen" | "user";
  content: string;
  timestamp: Date;
}

interface EstateSummary {
  assets:      GraphNodeDTO[];
  vendors:     GraphNodeDTO[];
  useCases:    GraphNodeDTO[];
  coverage:    CoverageReportDTO | null;
  portfolio:   PortfolioRiskReportDTO | null;
  boardReport: BoardReportDTO | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type Attrs = Record<string, unknown>;
function attr<T>(node: GraphNodeDTO, key: string): T | undefined {
  return (node.attributes as Attrs)?.[key] as T | undefined;
}
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const RISK_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UN_ASSESSED"];
function riskColor(level: string) {
  return level === "CRITICAL" ? "🔴" : level === "HIGH" ? "🟠" : level === "MEDIUM" ? "🟡" : level === "LOW" ? "🟢" : "⚪";
}

// ─────────────────────────────────────────────────────────────────────────────
// Sen intelligence — question handlers
// ─────────────────────────────────────────────────────────────────────────────

function buildResponse(input: string, data: EstateSummary): string {
  const q = input.toLowerCase();

  const software = data.assets.filter((a) => attr<string>(a, "kind") === "MODEL_DEPLOYMENT");
  const hardware = data.assets.filter((a) => attr<string>(a, "kind") !== "MODEL_DEPLOYMENT");

  // ── Risk questions ───────────────────────────────────────────────────────
  if (/most at risk|highest risk|riskiest|risky|critical tool|critical use case/.test(q)) {
    const summaries = data.boardReport?.risk?.useCaseSummaries ?? [];
    const sorted = [...summaries].sort(
      (a, b) => RISK_ORDER.indexOf(a.residualLevel) - RISK_ORDER.indexOf(b.residualLevel),
    );
    if (sorted.length === 0) return "I don't have risk data yet. Run a sync and risk assessment first.";
    const top = sorted[0];
    const rest = sorted.slice(1, 4);
    return [
      `**${riskColor(top.residualLevel)} ${top.label}** is your highest-risk use case — rated **${top.residualLevel}**.`,
      top.topSignals.length > 0
        ? `\nKey signals: ${top.topSignals.slice(0, 2).map((s) => `• ${s}`).join("\n")}`
        : "",
      rest.length > 0
        ? `\nAlso watch:\n${rest.map((r) => `• ${riskColor(r.residualLevel)} **${r.label}** — ${r.residualLevel}`).join("\n")}`
        : "",
      `\n→ [Review all use cases](/use-cases)`,
    ].filter(Boolean).join("");
  }

  // ── Vendor questions ─────────────────────────────────────────────────────
  if (/vendor.*most tool|most tool.*vendor|top vendor|which vendor|vendor count|vendor breakdown/.test(q)) {
    const vendorCounts: Record<string, number> = {};
    software.forEach((a) => {
      const v = attr<string>(a, "vendor") ?? "Unknown";
      vendorCounts[v] = (vendorCounts[v] ?? 0) + 1;
    });
    const sorted = Object.entries(vendorCounts).sort(([, a], [, b]) => b - a).slice(0, 6);
    if (sorted.length === 0) return "No vendor data available yet. Run a sync first.";
    const top = sorted[0];
    return [
      `**${top[0]}** has the most tools with **${top[1]} tool${top[1] > 1 ? "s" : ""}** in your estate.`,
      `\nTop vendors by tool count:\n${sorted.map(([v, c], i) => `${i + 1}. **${v}** — ${c} tool${c > 1 ? "s" : ""}`).join("\n")}`,
      `\nYou have **${data.vendors.length} vendors** total across **${software.length} software tools**.`,
      `\n→ [View inventory](/inventory)`,
    ].join("");
  }

  // ── Spend questions ──────────────────────────────────────────────────────
  if (/spend|cost|budget|expensive|price|how much/.test(q)) {
    const totalSoftware = software.reduce((s, a) => s + (attr<number>(a, "monthlyCostUsd") ?? 0), 0);
    const totalHardware = hardware.reduce((s, a) => s + (attr<number>(a, "monthlyCostUsd") ?? 0), 0);
    const total = totalSoftware + totalHardware;

    const topSoftware = [...software]
      .sort((a, b) => (attr<number>(b, "monthlyCostUsd") ?? 0) - (attr<number>(a, "monthlyCostUsd") ?? 0))
      .slice(0, 3);

    return [
      `Your total AI estate spend is **${fmt(total)}/month**.`,
      `\n• **Software tools:** ${fmt(totalSoftware)}/mo (${software.length} tools)`,
      `• **Hardware (GPU compute):** ${fmt(totalHardware)}/mo (${hardware.length} instances)`,
      topSoftware.length > 0
        ? `\nYour most expensive software tools:\n${topSoftware.map((a) => `• **${a.label}** — ${fmt(attr<number>(a, "monthlyCostUsd") ?? 0)}/mo`).join("\n")}`
        : "",
      `\n→ [View full inventory](/inventory)`,
    ].filter(Boolean).join("");
  }

  // ── Compliance / gap questions ───────────────────────────────────────────
  if (/compliance|gap|gdpr|regulation|obligation|legal|jurisdiction|breach/.test(q)) {
    const comp = data.boardReport?.compliance;
    if (!comp) return "Compliance data isn't available yet. Run a sync and compliance analysis first.";
    const topGap = comp.topGaps?.[0];
    return [
      `You have **${comp.totalGaps} compliance gaps** across **${comp.totalObligationsTriggered} triggered obligations**.`,
      topGap
        ? `\nMost widespread gap: **${topGap.obligationTitle}** (${topGap.ruleSetName})\n  Affects ${topGap.affectedUseCaseCount} use case${topGap.affectedUseCaseCount > 1 ? "s" : ""}: ${topGap.affectedUseCaseLabels.slice(0, 3).join(", ")}`
        : "",
      comp.topGaps.length > 1
        ? `\nOther gaps:\n${comp.topGaps.slice(1, 4).map((g) => `• **${g.obligationTitle}** — affects ${g.affectedUseCaseCount} use case${g.affectedUseCaseCount > 1 ? "s" : ""}`).join("\n")}`
        : "",
      `\n→ [Run compliance analysis](/compliance)`,
    ].filter(Boolean).join("");
  }

  // ── Coverage questions ───────────────────────────────────────────────────
  if (/coverage|how covered|blind spot|unconfirmed|missing/.test(q)) {
    const cov = data.coverage;
    if (!cov) return "Coverage data isn't available yet.";
    const label = cov.coverageScore >= 80 ? "strong" : cov.coverageScore >= 50 ? "moderate" : "weak";
    return [
      `Your estate coverage score is **${cov.coverageScore}%** — **${label}**.`,
      `\n• **${cov.telemetryNodes}** nodes from telemetry (automated)`,
      `• **${cov.manualNodes}** manually added nodes`,
      `• **${cov.unconfirmedLowConfidence}** nodes awaiting confirmation`,
      cov.blindSpots.length > 0
        ? `\nTop blind spot: "${cov.blindSpots[0].description}"\n${cov.blindSpots.length > 1 ? `(+${cov.blindSpots.length - 1} more)` : ""}`
        : "\nNo blind spots detected — excellent coverage!",
      `\n→ [View coverage report](/coverage)`,
    ].filter(Boolean).join("");
  }

  // ── Team / department questions ──────────────────────────────────────────
  if (/team|department|who use|which team/.test(q)) {
    const teamCounts: Record<string, number> = {};
    software.forEach((a) => {
      const team = (attr<Attrs>(a, "tags") as Attrs)?.team as string | undefined ?? "unknown";
      teamCounts[team] = (teamCounts[team] ?? 0) + 1;
    });
    const sorted = Object.entries(teamCounts).sort(([, a], [, b]) => b - a);
    if (sorted.length === 0) return "No team tagging data found.";
    const top = sorted[0];
    const NAMES: Record<string, string> = {
      ops: "Operations", sales: "Sales", product: "Product",
      legal: "Legal", finance: "Finance", "cx-ai": "Customer Experience", strategy: "Strategy",
    };
    return [
      `**${NAMES[top[0]] ?? top[0]}** uses the most AI tools with **${top[1]} tool${top[1] > 1 ? "s" : ""}**.`,
      `\nTool usage by team:\n${sorted.map(([t, c]) => `• **${NAMES[t] ?? t}** — ${c} tool${c > 1 ? "s" : ""}`).join("\n")}`,
      `\n→ [View use cases](/use-cases)`,
    ].join("");
  }

  // ── Jurisdiction questions ───────────────────────────────────────────────
  if (/jurisdiction|country|region|where|geography|gdpr|operate/.test(q)) {
    const usedRegions = [...new Set(
      data.assets.map((a) => attr<string>(a, "region")).filter(Boolean) as string[],
    )];
    return [
      `Your AI estate operates across **${usedRegions.length} region${usedRegions.length > 1 ? "s" : ""}**:`,
      `\n${usedRegions.map((r) => `• ${r}`).join("\n")}`,
      `\nThis triggers compliance obligations in the EU (GDPR, EU AI Act), UK (ICO guidance), US (NIST AI RMF), and SG (PDPA) — depending on which use cases touch each region.`,
      `\n→ [View compliance analysis](/compliance)`,
    ].join("");
  }

  // ── Tool inventory questions ─────────────────────────────────────────────
  if (/how many tool|list tool|all tool|inventory|what tool|software tool/.test(q)) {
    const cats: Record<string, number> = {};
    software.forEach((a) => {
      const labels = attr<string[]>(a, "useCaseLabels") ?? ["Other"];
      cats[labels[0]] = (cats[labels[0]] ?? 0) + 1;
    });
    const sorted = Object.entries(cats).sort(([, a], [, b]) => b - a);
    return [
      `You have **${software.length} software AI tools** across **${data.useCases.length} use cases**.`,
      sorted.length > 0
        ? `\nBreakdown by primary use case:\n${sorted.map(([cat, c]) => `• **${cat}** — ${c} tool${c > 1 ? "s" : ""}`).join("\n")}`
        : "",
      `\n→ [Browse inventory](/inventory)`,
    ].filter(Boolean).join("");
  }

  // ── Risk summary / portfolio ─────────────────────────────────────────────
  if (/risk portfolio|risk summary|overall risk|risk posture|risk score/.test(q)) {
    const p = data.portfolio;
    if (!p) return "Portfolio risk data isn't available yet.";
    const byLevel = p.byLevel;
    const levels = Object.entries(byLevel).sort(([a], [b]) => RISK_ORDER.indexOf(a) - RISK_ORDER.indexOf(b));
    return [
      `Your portfolio has **${p.totalUseCases} use cases** assessed for risk:`,
      `\n${levels.filter(([, v]) => v > 0).map(([l, v]) => `• ${riskColor(l)} **${l}** — ${v} use case${v > 1 ? "s" : ""}`).join("\n")}`,
      p.highOrCritical > 0
        ? `\n⚠️ **${p.highOrCritical} use case${p.highOrCritical > 1 ? "s" : ""}** at High or Critical risk require immediate attention.`
        : "\n✅ No Critical or High risk use cases detected.",
      p.concentrationFlags.length > 0
        ? `\n⚠️ Vendor concentration risk: **${p.concentrationFlags[0].vendorLabel}** accounts for ${Math.round(p.concentrationFlags[0].portfolioShare * 100)}% of use cases.`
        : "",
      `\n→ [View use cases](/use-cases)`,
    ].filter(Boolean).join("");
  }

  // ── Open actions / rectifications ────────────────────────────────────────
  if (/rectification|open action|action item|remediat|fix|resolve/.test(q)) {
    return [
      "Rectifications are tracked remediations for identified compliance gaps or risk findings.",
      "\nHead to the Rectifications page to see all open items, their owners, and evidence status.",
      "\n→ [View rectifications](/rectifications)",
    ].join("");
  }

  // ── Hardware / GPU ───────────────────────────────────────────────────────
  if (/hardware|gpu|compute|instance|server/.test(q)) {
    const totalHW = hardware.reduce((s, a) => s + (attr<number>(a, "monthlyCostUsd") ?? 0), 0);
    const vendorCounts: Record<string, number> = {};
    hardware.forEach((a) => {
      const v = attr<string>(a, "vendor") ?? "Unknown";
      vendorCounts[v] = (vendorCounts[v] ?? 0) + 1;
    });
    const sorted = Object.entries(vendorCounts).sort(([, a], [, b]) => b - a);
    return [
      `You have **${hardware.length} GPU compute instances** at **${fmt(totalHW)}/month**.`,
      sorted.length > 0
        ? `\nTop hardware vendors:\n${sorted.slice(0, 5).map(([v, c]) => `• **${v}** — ${c} instance${c > 1 ? "s" : ""}`).join("\n")}`
        : "",
      `\n→ [View hardware inventory](/inventory)`,
    ].filter(Boolean).join("");
  }

  // ── Greetings ────────────────────────────────────────────────────────────
  if (/^(hi|hello|hey|howdy|greet)/.test(q)) {
    const totalSpend = [...data.assets].reduce((s, a) => s + (attr<number>(a, "monthlyCostUsd") ?? 0), 0);
    return `Hi! I'm Sen, your GRC AI assistant. Your estate currently has **${software.length} software tools**, **${hardware.length} GPU instances**, and a total spend of **${fmt(totalSpend)}/month**.\n\nWhat would you like to know?`;
  }

  // ── Help ─────────────────────────────────────────────────────────────────
  if (/help|what can you|what do you know|capabilities/.test(q)) {
    return [
      "I can answer questions about your AI estate, including:",
      "\n• **Risk** — which tools or use cases are highest risk",
      "• **Vendors** — which vendors have the most tools",
      "• **Spend** — total cost, most expensive tools",
      "• **Compliance** — regulatory gaps and obligations",
      "• **Coverage** — how well-documented your estate is",
      "• **Teams** — which departments use the most AI",
      "• **Jurisdictions** — where your tools are operating",
      "• **Hardware** — GPU compute assets and cost",
      "\nJust ask naturally — I'll figure it out.",
    ].join("");
  }

  // ── Default ──────────────────────────────────────────────────────────────
  return [
    "I'm not sure I have a specific answer for that, but here's a quick estate summary:",
    `\n• **${software.length}** software tools · **${hardware.length}** GPU instances`,
    `• **${data.useCases.length}** use cases · **${data.vendors.length}** vendors`,
    data.coverage ? `• Coverage score: **${data.coverage.coverageScore}%**` : "",
    data.portfolio?.highOrCritical
      ? `• ⚠️ **${data.portfolio.highOrCritical}** use case${data.portfolio.highOrCritical > 1 ? "s" : ""} at High/Critical risk`
      : "",
    "\nTry asking: \"Which tool is most at risk?\", \"What's our spend?\", or \"Show compliance gaps\".",
  ].filter(Boolean).join("");
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown-lite renderer
// ─────────────────────────────────────────────────────────────────────────────

function RenderMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1 text-[12.5px] leading-relaxed">
      {lines.map((line, i) => {
        // Convert **bold** + links
        const parts = line.split(/(\*\*[^*]+\*\*|\[.*?\]\(.*?\))/g).map((part, j) => {
          const bold = part.match(/^\*\*(.+)\*\*$/);
          if (bold) return <strong key={j} className="text-[#D9C8B4] font-semibold">{bold[1]}</strong>;
          const link = part.match(/^\[(.+)\]\((.+)\)$/);
          if (link) return (
            <a key={j} href={link[2]}
              className="text-[#9baf9c] underline underline-offset-2 hover:text-[#c4d4c5] transition-colors">
              {link[1]}
            </a>
          );
          return <span key={j}>{part}</span>;
        });
        if (line.startsWith("• ") || line.startsWith("- ")) {
          return <div key={i} className="flex gap-1.5"><span className="text-[#5c5248] flex-shrink-0 mt-0.5">•</span><span>{parts}</span></div>;
        }
        if (line.match(/^\d+\. /)) {
          return <div key={i} className="flex gap-1.5">{parts}</div>;
        }
        if (line === "") return <div key={i} className="h-1" />;
        return <div key={i}>{parts}</div>;
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggested questions
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTED = [
  "Which tool is most at risk?",
  "Which vendor has the most tools?",
  "What's our total AI spend?",
  "Show me compliance gaps",
  "Which team uses the most tools?",
  "What jurisdictions are we in?",
  "How's our coverage score?",
  "Show hardware assets",
];

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function SenChat() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [data,     setData]     = useState<EstateSummary | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Load estate data when first opened
  const loadData = useCallback(async () => {
    if (data) return;
    setDataLoading(true);
    try {
      const [assetsRes, vendorsRes, useCasesRes, coverage, portfolio, boardReport] =
        await Promise.allSettled([
          getNodes(),
          getNodes("VENDOR"),
          getUseCases(),
          getCoverage(),
          getPortfolioRisk(),
          getBoardReport(),
        ]);

      const summary: EstateSummary = {
        assets:      assetsRes.status      === "fulfilled" ? assetsRes.value.data      : [],
        vendors:     vendorsRes.status     === "fulfilled" ? vendorsRes.value.data     : [],
        useCases:    useCasesRes.status    === "fulfilled" ? useCasesRes.value.data    : [],
        coverage:    coverage.status       === "fulfilled" ? coverage.value            : null,
        portfolio:   portfolio.status      === "fulfilled" ? portfolio.value           : null,
        boardReport: boardReport.status    === "fulfilled" ? boardReport.value         : null,
      };
      setData(summary);

      // Greeting message
      const software = summary.assets.filter((a) => attr<string>(a, "kind") === "MODEL_DEPLOYMENT");
      const totalSpend = summary.assets.reduce((s, a) => s + (attr<number>(a, "monthlyCostUsd") ?? 0), 0);
      const greeting = [
        `Hi, I'm **Sen** — your GRC AI assistant for Sentinel.`,
        `\nI can see your full AI estate: **${software.length} tools**, **${summary.vendors.length} vendors**, **${summary.useCases.length} use cases** across **${summary.assets.filter((a) => attr<string>(a, "kind") !== "MODEL_DEPLOYMENT").length} GPU instances**. Total spend: **${fmt(totalSpend)}/month**.`,
        `\nAsk me anything about risk, spend, compliance, or vendors.`,
      ].join("");

      setMessages([{ id: "greeting", role: "sen", content: greeting, timestamp: new Date() }]);
    } finally {
      setDataLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (open) {
      loadData();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, loadData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading || !data) return;
    setInput("");

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: q, timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    // Simulate thinking delay (150–300ms) then compute response
    await new Promise((r) => setTimeout(r, 150 + Math.random() * 150));
    const response = buildResponse(q, data);
    const senMsg: Message = { id: `s-${Date.now()}`, role: "sen", content: response, timestamp: new Date() };
    setMessages((m) => [...m, senMsg]);
    setLoading(false);
  }

  return (
    <>
      {/* ── Floating button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-2xl shadow-black/60 flex items-center justify-center transition-all ${
          open ? "bg-[#2a2825] border border-[#3a3835]" : "bg-[#8A9C8B] hover:bg-[#9baf9c]"
        }`}
        aria-label="Open Sen AI assistant"
      >
        {open ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#9a9078]">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-[#1a1918]">
            <path d="M9 1.5L15.5 4.2V9.5C15.5 13 12 15.8 9 16.5C6 15.8 2.5 13 2.5 9.5V4.2L9 1.5Z"
              stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
            <path d="M6 9l2 2L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* ── Panel ───────────────────────────────────────────────────────── */}
      <div className={`fixed bottom-0 right-0 z-40 flex flex-col transition-all duration-300 ease-in-out ${
        open ? "h-[520px] w-[380px] opacity-100 translate-y-0" : "h-0 w-[380px] opacity-0 translate-y-4 pointer-events-none"
      }`}
        style={{ bottom: open ? "72px" : "0", right: "16px" }}
      >
        <div className="flex flex-col h-full rounded-2xl border border-[#2a2825] bg-[#1a1918] shadow-2xl shadow-black/80 overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2825] bg-[#1e1c1a] flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-[#8A9C8B] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" className="text-[#1a1918]">
                <path d="M9 1.5L15.5 4.2V9.5C15.5 13 12 15.8 9 16.5C6 15.8 2.5 13 2.5 9.5V4.2L9 1.5Z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M6 9l2 2L12 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-[#D9C8B4] leading-none">Sen</p>
              <p className="text-[10px] text-[#5c5248] mt-0.5">GRC AI Assistant</p>
            </div>
            {dataLoading && (
              <div className="flex items-center gap-1.5">
                <svg className="animate-spin text-[#8A9C8B]" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"
                    strokeDasharray="14" strokeDashoffset="4" strokeLinecap="round"/>
                </svg>
                <span className="text-[10px] text-[#5c5248]">Loading estate…</span>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.length === 0 && !dataLoading && (
              <div className="text-center py-8">
                <p className="text-[12px] text-[#5c5248]">Loading your estate data…</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "sen" && (
                  <div className="w-6 h-6 rounded-full bg-[#8A9C8B] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 18 18" fill="none" className="text-[#1a1918]">
                      <path d="M9 1.5L15.5 4.2V9.5C15.5 13 12 15.8 9 16.5C6 15.8 2.5 13 2.5 9.5V4.2L9 1.5Z"
                        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <div className={`max-w-[88%] rounded-xl px-3 py-2.5 ${
                  msg.role === "sen"
                    ? "bg-[#252220] border border-[#2a2825] text-[#9a9078]"
                    : "bg-[#8A9C8B] text-[#1a1918]"
                }`}>
                  {msg.role === "sen"
                    ? <RenderMessage content={msg.content} />
                    : <p className="text-[12.5px] font-medium">{msg.content}</p>
                  }
                  <p className={`text-[9.5px] mt-1.5 ${msg.role === "sen" ? "text-[#3a3430]" : "text-[#1a1918] opacity-60"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#8A9C8B] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="10" height="10" viewBox="0 0 18 18" fill="none" className="text-[#1a1918]">
                    <path d="M9 1.5L15.5 4.2V9.5C15.5 13 12 15.8 9 16.5C6 15.8 2.5 13 2.5 9.5V4.2L9 1.5Z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="bg-[#252220] border border-[#2a2825] rounded-xl px-3 py-2.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5c5248] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5c5248] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5c5248] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions (shown when only greeting) */}
          {messages.length <= 1 && !loading && data && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-[10.5px] text-[#9a9078] bg-[#252220] border border-[#2a2825] hover:border-[#8A9C8B44] hover:text-[#D9C8B4] rounded-full px-2.5 py-1 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-[#2a2825] flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={data ? "Ask Sen anything…" : "Loading estate data…"}
              disabled={!data || loading}
              className="flex-1 bg-[#252220] border border-[#2a2825] rounded-lg px-3 py-2 text-[12.5px] text-[#D9C8B4] placeholder-[#3a3430] focus:outline-none focus:border-[#8A9C8B] transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading || !data}
              className="w-8 h-8 rounded-lg bg-[#8A9C8B] hover:bg-[#9baf9c] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[#1a1918]">
                <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop (mobile) */}
      {open && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  );
}
