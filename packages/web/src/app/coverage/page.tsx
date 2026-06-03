import type { Metadata } from "next";
import Link from "next/link";
import { getCoverage } from "@/lib/api";
import { Card, CardTitle } from "@/components/Card";

export const metadata: Metadata = { title: "Coverage Report" };

const BLIND_SPOT_LABELS: Record<string, string> = {
  LOW_CONFIDENCE_UNCONFIRMED: "Low Confidence — Unconfirmed",
  ASSET_NO_USE_CASE:          "Asset Not Linked to Use Case",
  USE_CASE_NO_ASSETS:         "Use Case Has No Assets",
  MANUAL_ONLY_NODE:           "Manual Entry — No Telemetry",
  UNTAGGED_ASSET:             "Untagged Asset",
};

const BLIND_SPOT_COLORS: Record<string, string> = {
  LOW_CONFIDENCE_UNCONFIRMED: "text-[#f87171]",
  ASSET_NO_USE_CASE:          "text-[#fbbf24]",
  USE_CASE_NO_ASSETS:         "text-[#fbbf24]",
  MANUAL_ONLY_NODE:           "text-[#f59e0b]",
  UNTAGGED_ASSET:             "text-[#f87171]",
};

export default async function CoveragePage() {
  let report;
  try {
    report = await getCoverage();
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[#e4e4f0]">Coverage Report</h1>
        <Card>
          <p className="text-[#f87171] text-sm">Could not load coverage data. Is the API running?</p>
        </Card>
      </div>
    );
  }

  const score = report.coverageScore;
  const scoreColor = score >= 80 ? "#4ade80" : score >= 50 ? "#fbbf24" : "#f87171";
  const circumference = 2 * Math.PI * 54;
  const dash = (score / 100) * circumference;

  // Group blind spots by kind
  const grouped = report.blindSpots.reduce<Record<string, typeof report.blindSpots>>((acc, bs) => {
    (acc[bs.kind] ??= []).push(bs);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e4e4f0]">Coverage Report</h1>
        <p className="text-[#8b8ba8] text-sm mt-1">
          Computed at {new Date(report.computedAt).toLocaleString()}
        </p>
      </div>

      {/* Score + stats */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Donut chart */}
        <Card className="flex flex-col items-center justify-center py-6">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="54" fill="none" stroke="#2a2a38" strokeWidth="12" />
            <circle
              cx="70" cy="70" r="54"
              fill="none"
              stroke={scoreColor}
              strokeWidth="12"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ filter: `drop-shadow(0 0 8px ${scoreColor}66)` }}
            />
            <text x="70" y="70" textAnchor="middle" dominantBaseline="central"
              fill={scoreColor} fontSize="24" fontWeight="bold">{score}%</text>
            <text x="70" y="90" textAnchor="middle" fill="#5b5b70" fontSize="10">coverage</text>
          </svg>
        </Card>

        <Card>
          <CardTitle>Node Breakdown</CardTitle>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-[#8b8ba8]">Total nodes</dt>
              <dd className="text-sm font-semibold text-[#e4e4f0]">{report.totalNodes}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-[#8b8ba8]">From telemetry</dt>
              <dd className="text-sm font-semibold text-[#4ade80]">{report.telemetryNodes}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-[#8b8ba8]">Manual entries</dt>
              <dd className="text-sm font-semibold text-[#fbbf24]">{report.manualNodes}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-[#8b8ba8]">Awaiting confirmation</dt>
              <dd className={`text-sm font-semibold ${report.unconfirmedLowConfidence > 0 ? "text-[#f87171]" : "text-[#4ade80]"}`}>
                {report.unconfirmedLowConfidence}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle>Blind Spot Summary</CardTitle>
          {report.blindSpots.length === 0 ? (
            <p className="text-sm text-[#4ade80]">No blind spots detected.</p>
          ) : (
            <dl className="space-y-2">
              {Object.entries(grouped).map(([kind, items]) => (
                <div key={kind} className="flex justify-between">
                  <dt className={`text-xs ${BLIND_SPOT_COLORS[kind] ?? "text-[#8b8ba8]"}`}>
                    {BLIND_SPOT_LABELS[kind] ?? kind}
                  </dt>
                  <dd className="text-xs font-semibold text-[#e4e4f0]">{items.length}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      </div>

      {/* Mandatory disclaimer — Principle 3 */}
      <div className="flex gap-3 p-4 rounded-xl border border-[#f59e0b44] bg-[#f59e0b08]">
        <span className="text-[#fbbf24] flex-shrink-0 text-lg">⚠</span>
        <div>
          <p className="text-xs font-semibold text-[#fbbf24] mb-1">Coverage disclaimer (required in all exports)</p>
          <p className="text-xs text-[#8b8ba8] leading-relaxed">{report.disclaimer}</p>
        </div>
      </div>

      {/* Blind spots detail */}
      {report.blindSpots.length > 0 && (
        <Card>
          <CardTitle>Blind Spots — Full Detail ({report.blindSpots.length})</CardTitle>
          <div className="space-y-3">
            {Object.entries(grouped).map(([kind, items]) => (
              <div key={kind}>
                <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${BLIND_SPOT_COLORS[kind] ?? "text-[#8b8ba8]"}`}>
                  {BLIND_SPOT_LABELS[kind] ?? kind} ({items.length})
                </h3>
                <ul className="space-y-1 pl-3">
                  {items.map((bs) => (
                    <li key={bs.nodeId} className="flex items-start gap-2 text-sm">
                      <span className="text-[#2a2a38] mt-1">·</span>
                      <span>
                        <Link
                          href={`/nodes/${encodeURIComponent(bs.nodeId)}`}
                          className="text-[#a5b4fc] hover:underline font-medium"
                        >
                          {bs.label}
                        </Link>
                        <span className="text-[#5b5b70] ml-2 text-xs">{bs.description}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
