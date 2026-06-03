import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNode, getNodeHistory } from "@/lib/api";
import { Card, CardTitle } from "@/components/Card";
import { ConfidenceBadge, NodeTypeBadge, SourceBadge } from "@/components/Badge";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata: Metadata = { title: "Node Detail" };

export default async function NodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const [nodeResult, historyResult] = await Promise.allSettled([
    getNode(decodedId),
    getNodeHistory(decodedId),
  ]);

  if (nodeResult.status === "rejected") notFound();

  const node = nodeResult.value;
  const history = historyResult.status === "fulfilled" ? historyResult.value : null;
  const attrs = node.attributes as Record<string, unknown>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#5b5b70]">
        <Link href="/inventory" className="hover:text-[#8b8ba8] transition-colors">Inventory</Link>
        <span>/</span>
        <span className="text-[#8b8ba8]">{node.label}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#e4e4f0]">{node.label}</h1>
          <p className="text-xs text-[#5b5b70] font-mono mt-1">{node.id}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <NodeTypeBadge type={node.type} />
          <ConfidenceBadge confidence={node.confidence} />
          <SourceBadge source={node.source} />
          {node.confidence === "LOW" && !node.confirmed && (
            <ConfirmButton nodeId={node.id} />
          )}
        </div>
      </div>

      {/* Manual entry warning — Principle 2 */}
      {node.source === "MANUAL" && (
        <div className="flex gap-3 p-4 rounded-xl border border-[#f59e0b33] bg-[#f59e0b08]">
          <span className="text-[#fbbf24] flex-shrink-0">⚠</span>
          <p className="text-xs text-[#8b8ba8]">
            <span className="text-[#fbbf24] font-medium">Manual entry — </span>
            this node was created manually and has not been corroborated by live telemetry.
            It will appear as a blind spot in coverage reports until a connector confirms it.
          </p>
        </div>
      )}

      {/* Attributes */}
      {Object.keys(attrs).length > 0 && (
        <Card>
          <CardTitle>Attributes</CardTitle>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
            {Object.entries(attrs).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-[#5b5b70] uppercase tracking-wide">{k}</dt>
                <dd className="text-sm text-[#e4e4f0] mt-0.5 font-mono break-all">
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* Event history — evidence trail */}
      <Card>
        <CardTitle>
          Evidence Trail {history ? `(${history.count} events)` : ""}
        </CardTitle>
        {!history || history.events.length === 0 ? (
          <p className="text-sm text-[#5b5b70]">No events recorded yet.</p>
        ) : (
          <div className="space-y-1">
            {history.events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 py-2 border-b border-[#1e1e28] last:border-0">
                <span className="text-[#5b5b70] text-xs w-36 flex-shrink-0 pt-0.5">
                  {new Date(e.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="text-sm">
                  <span className="text-[#a5b4fc] font-medium">{e.type.replace(/_/g, " ")}</span>
                  <span className="text-[#5b5b70] text-xs ml-2">by {e.actor}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
