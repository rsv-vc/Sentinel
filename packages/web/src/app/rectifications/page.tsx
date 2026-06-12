import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardTitle } from "@/components/Card";
import { RectificationPanel } from "@/components/RectificationPanel";

export const metadata: Metadata = { title: "Rectifications" };

const mockRectifications = [
  { id: "r-1", title: "Review Anthropic vendor contract for EU data residency", status: "OPEN", priority: "HIGH", useCaseId: "uc-3", useCaseLabel: "Customer Support Triage", createdAt: "2026-06-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z", description: "Ensure DPA covers EU customer data processed via Claude API.", evidence: [] },
  { id: "r-2", title: "Implement model evaluation framework", status: "IN_PROGRESS", priority: "HIGH", useCaseId: "uc-5", useCaseLabel: "Financial Forecasting Model", createdAt: "2026-05-20T09:00:00Z", updatedAt: "2026-06-05T14:00:00Z", description: "Establish red-teaming and evaluation pipeline before production.", evidence: [] },
  { id: "r-3", title: "Restrict GPT-4 data egress to US-only endpoints", status: "OPEN", priority: "MEDIUM", useCaseId: "uc-6", useCaseLabel: "HR Policy Chatbot", createdAt: "2026-06-03T08:00:00Z", updatedAt: "2026-06-03T08:00:00Z", description: "HR data must not leave US jurisdiction per policy.", evidence: [] },
];

export default function RectificationsPage() {
  const items = mockRectifications;
  const open       = items.filter((r) => r.status === "OPEN");
  const inProgress = items.filter((r) => r.status === "IN_PROGRESS");
  const resolved   = items.filter((r) => r.status === "RESOLVED");
  const wontFix    = items.filter((r) => r.status === "WONT_FIX");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rectifications"
        subtitle="Remediation actions against risk signals and compliance gaps — rectify, not transfer"
      />

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Open",        count: open.length,       color: "text-[#d4a456]" },
          { label: "In Progress", count: inProgress.length, color: "text-[#9baf9c]" },
          { label: "Resolved",    count: resolved.length,   color: "text-[#9baf9c]" },
          { label: "Won't Fix",   count: wontFix.length,    color: "text-[#5c5248]" },
        ].map(({ label, count, color }) => (
          <Card key={label}>
            <p className="text-xs text-[#5c5248] uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{count}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardTitle>All Rectifications</CardTitle>
        <RectificationPanel rectifications={items as any} title="" />
      </Card>
    </div>
  );
}
