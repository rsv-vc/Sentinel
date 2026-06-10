import type { Metadata } from "next";
import Link from "next/link";
import { serverListRectifications as listRectifications } from "@/lib/serverApi";
import { PageHeader } from "@/components/PageHeader";
import type { RectificationDTO } from "@/lib/api";
import { Card, CardTitle } from "@/components/Card";
import { RectificationPanel } from "@/components/RectificationPanel";

export const metadata: Metadata = { title: "Rectifications" };


export default async function RectificationsPage() {
  let items: RectificationDTO[] = [];
  let fetchError: string | null = null;

  try {
    const result = await listRectifications();
    items = result.data;
  } catch (e) {
    fetchError = String(e);
  }

  const open        = items.filter((r) => r.status === "OPEN");
  const inProgress  = items.filter((r) => r.status === "IN_PROGRESS");
  const resolved    = items.filter((r) => r.status === "RESOLVED");
  const wontFix     = items.filter((r) => r.status === "WONT_FIX");

  return (
    <div className="space-y-6">

      <PageHeader
        title="Rectifications"
        subtitle="Remediation actions against risk signals and compliance gaps — rectify, not transfer"
      />

      {/* KPI row */}
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

      {fetchError && (
        <Card>
          <p className="text-sm text-[#d4836e]">
            Failed to load rectifications — ensure the API is running.<br />
            <span className="text-xs text-[#5c5248]">{fetchError}</span>
          </p>
        </Card>
      )}

      {/* New rectification + list */}
      <Card>
        <CardTitle>All Rectifications</CardTitle>
        <RectificationPanel
          rectifications={items.map((r) => ({ ...r, evidence: [] }))}
          title=""
        />
      </Card>

      {items.length === 0 && !fetchError && (
        <Card>
          <p className="text-sm text-[#5c5248] text-center py-6">
            No rectification actions yet. Open one from a use-case detail page or use the form above.
          </p>
          <p className="text-xs text-[#5c5248] text-center">
            <Link href="/use-cases" className="text-[#8A9C8B] hover:underline">Go to Use Cases →</Link>
          </p>
        </Card>
      )}
    </div>
  );
}
