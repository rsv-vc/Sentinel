import type { Metadata } from "next";
import Link from "next/link";
import { getNodes } from "@/lib/api";
import { Card, CardTitle } from "@/components/Card";
import { ConfidenceBadge, NodeTypeBadge, SourceBadge } from "@/components/Badge";

export const metadata: Metadata = { title: "Inventory" };

const NODE_TYPES = ["USE_CASE", "ASSET", "VENDOR", "DATA_ASSET", "JURISDICTION"] as const;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const activeType = params.type;
  const filter = params.filter; // "low" = show only LOW confidence

  const { data: nodes } = await getNodes(activeType);

  const displayed = filter === "low"
    ? nodes.filter((n) => n.confidence === "LOW" && !n.confirmed)
    : nodes;

  const stats = {
    total: nodes.length,
    low: nodes.filter((n) => n.confidence === "LOW" && !n.confirmed).length,
    manual: nodes.filter((n) => n.source === "MANUAL").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#e4e4f0]">Inventory</h1>
        <p className="text-[#8b8ba8] text-sm mt-1">
          All registered nodes in the AI estate graph
        </p>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/inventory"
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            !activeType && !filter
              ? "bg-[#6366f1] text-white"
              : "text-[#8b8ba8] hover:text-[#e4e4f0] border border-[#2a2a38] hover:border-[#6366f1]"
          }`}
        >
          All ({stats.total})
        </Link>
        {NODE_TYPES.map((t) => (
          <Link
            key={t}
            href={`/inventory?type=${t}`}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeType === t
                ? "bg-[#6366f1] text-white"
                : "text-[#8b8ba8] hover:text-[#e4e4f0] border border-[#2a2a38] hover:border-[#6366f1]"
            }`}
          >
            {t.replace(/_/g, " ")}
          </Link>
        ))}
        {stats.low > 0 && (
          <Link
            href="/inventory?filter=low"
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === "low"
                ? "bg-[#f59e0b] text-[#09090f]"
                : "text-[#fbbf24] border border-[#f59e0b44] hover:border-[#fbbf24]"
            }`}
          >
            ⚠ Needs confirmation ({stats.low})
          </Link>
        )}
      </div>

      {/* Summary chips */}
      <div className="flex gap-4 text-sm text-[#5b5b70]">
        <span>{displayed.length} shown</span>
        {stats.manual > 0 && <span>· {stats.manual} manual entries</span>}
        {stats.low > 0 && <span className="text-[#fbbf24]">· {stats.low} awaiting confirmation</span>}
      </div>

      {/* Node list */}
      {displayed.length === 0 ? (
        <Card>
          <p className="text-sm text-[#5b5b70] text-center py-8">
            No nodes found. Run a sync from the Dashboard to populate the estate.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayed.map((node) => (
            <Link
              key={node.id}
              href={
                node.type === "USE_CASE"
                  ? `/use-cases/${encodeURIComponent(node.id)}`
                  : `/nodes/${encodeURIComponent(node.id)}`
              }
              className="block bg-[#111118] border border-[#2a2a38] rounded-xl p-4 hover:border-[#6366f144] hover:bg-[#111120] transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[#e4e4f0] group-hover:text-[#a5b4fc] transition-colors truncate">
                      {node.label}
                    </span>
                    {node.confidence === "LOW" && !node.confirmed && (
                      <span className="text-[#fbbf24] text-xs flex-shrink-0">⚠ Needs confirmation</span>
                    )}
                  </div>
                  <p className="text-xs text-[#5b5b70] mt-1 font-mono truncate">{node.id}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <NodeTypeBadge type={node.type} />
                  <ConfidenceBadge confidence={node.confidence} />
                  <SourceBadge source={node.source} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
