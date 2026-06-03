import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubgraph, getNodeHistory } from "@/lib/api";
import { Card, CardTitle } from "@/components/Card";
import { ConfidenceBadge, NodeTypeBadge, SourceBadge } from "@/components/Badge";
import { DependencyGraph } from "@/components/DependencyGraph";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata: Metadata = { title: "Use Case Detail" };

export default async function UseCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const [subgraphResult, historyResult] = await Promise.allSettled([
    getSubgraph(decodedId),
    getNodeHistory(decodedId),
  ]);

  if (subgraphResult.status === "rejected") notFound();

  const subgraph = subgraphResult.value;
  const history = historyResult.status === "fulfilled" ? historyResult.value : null;
  const root = subgraph.root;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#5b5b70]">
        <Link href="/use-cases" className="hover:text-[#8b8ba8] transition-colors">
          Use Cases
        </Link>
        <span>/</span>
        <span className="text-[#8b8ba8]">{root.label}</span>
      </div>

      {/* Title + badges */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#e4e4f0]">{root.label}</h1>
          <p className="text-xs text-[#5b5b70] font-mono mt-1">{root.id}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <NodeTypeBadge type={root.type} />
          <ConfidenceBadge confidence={root.confidence} />
          <SourceBadge source={root.source} />
          {root.confidence === "LOW" && !root.confirmed && (
            <ConfirmButton nodeId={root.id} />
          )}
        </div>
      </div>

      {/* Low-confidence warning */}
      {root.confidence === "LOW" && !root.confirmed && (
        <div className="flex gap-3 p-4 rounded-xl border border-[#f59e0b44] bg-[#f59e0b08]">
          <span className="text-[#fbbf24] text-lg flex-shrink-0">⚠</span>
          <div>
            <p className="text-sm font-medium text-[#fbbf24]">Awaiting confirmation</p>
            <p className="text-xs text-[#8b8ba8] mt-0.5">
              This use-case was inferred from connector data with low confidence.
              A human reviewer should confirm it represents a real, distinct use-case
              before it is treated as authoritative.
            </p>
          </div>
        </div>
      )}

      {/* Dependency graph */}
      <Card>
        <CardTitle>Dependency Graph</CardTitle>
        {subgraph.neighbours.length === 0 ? (
          <p className="text-sm text-[#5b5b70] py-4 text-center">
            No connected nodes yet. Run a sync to populate dependencies.
          </p>
        ) : (
          <DependencyGraph subgraph={subgraph} />
        )}
      </Card>

      {/* Neighbours table */}
      <Card>
        <CardTitle>Connected Nodes ({subgraph.neighbours.length})</CardTitle>
        {subgraph.neighbours.length === 0 ? (
          <p className="text-sm text-[#5b5b70]">None</p>
        ) : (
          <div className="space-y-2">
            {subgraph.neighbours.map((n) => (
              <Link
                key={n.id}
                href={`/nodes/${encodeURIComponent(n.id)}`}
                className="flex items-center justify-between p-3 rounded-lg border border-[#2a2a38] hover:border-[#6366f144] hover:bg-[#111120] transition-all group"
              >
                <div>
                  <span className="text-sm font-medium text-[#e4e4f0] group-hover:text-[#a5b4fc]">
                    {n.label}
                  </span>
                  <span className="text-xs text-[#5b5b70] ml-2 font-mono">{n.id.slice(0, 20)}…</span>
                </div>
                <div className="flex gap-2">
                  <NodeTypeBadge type={n.type} />
                  <ConfidenceBadge confidence={n.confidence} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Event history */}
      {history && history.events.length > 0 && (
        <Card>
          <CardTitle>Event History ({history.count})</CardTitle>
          <div className="space-y-2">
            {history.events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 text-sm">
                <span className="text-[#5b5b70] text-xs pt-0.5 flex-shrink-0 w-32">
                  {new Date(e.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="text-[#a5b4fc] font-medium">{e.type.replace(/_/g, " ")}</span>
                <span className="text-[#5b5b70] text-xs">by {e.actor}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
