import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  serverGetNodeGraph as getNodeGraph,
  serverGetNodeHistory as getNodeHistory,
} from "@/lib/serverApi";
import type { GraphNodeDTO, GraphEdgeDTO } from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardTitle } from "@/components/Card";
import { ConfidenceBadge, NodeTypeBadge, SourceBadge } from "@/components/Badge";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata: Metadata = { title: "Node Detail" };

// ---------------------------------------------------------------------------
// Relationship helpers
// ---------------------------------------------------------------------------

function getNeighboursByEdgeType(
  edges: GraphEdgeDTO[],
  neighbours: GraphNodeDTO[],
  edgeType: string,
  direction: "from" | "to",
  nodeId: string,
): GraphNodeDTO[] {
  const matchedIds = edges
    .filter((e) =>
      e.type === edgeType &&
      (direction === "from" ? e.fromId === nodeId : e.toId === nodeId),
    )
    .map((e) => (direction === "from" ? e.toId : e.fromId));
  return neighbours.filter((n) => matchedIds.includes(n.id));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RelationshipCard({
  title,
  nodes,
  emptyText,
  hrefPrefix,
}: {
  title: string;
  nodes: GraphNodeDTO[];
  emptyText: string;
  hrefPrefix: string;
}) {
  return (
    <Card>
      <CardTitle>{title} ({nodes.length})</CardTitle>
      {nodes.length === 0 ? (
        <p className="text-sm text-[#5c5248] py-2">{emptyText}</p>
      ) : (
        <div className="space-y-2 mt-2">
          {nodes.map((n) => (
            <Link
              key={n.id}
              href={`${hrefPrefix}/${encodeURIComponent(n.id)}`}
              className="flex items-center justify-between p-3 rounded-lg border border-[#2a2825] hover:border-[#8A9C8B44] hover:bg-[#1e2420] transition-all group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#D9C8B4] group-hover:text-[#c4d4c5] truncate">
                  {n.label}
                </p>
                <p className="text-xs text-[#5c5248] font-mono mt-0.5 truncate">{n.id}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <NodeTypeBadge type={n.type} />
                <ConfidenceBadge confidence={n.confidence} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function NodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const [graphResult, historyResult] = await Promise.allSettled([
    getNodeGraph(decodedId),
    getNodeHistory(decodedId),
  ]);

  if (graphResult.status === "rejected") notFound();

  const { root: node, neighbours, edges } = graphResult.value;
  const history = historyResult.status === "fulfilled" ? historyResult.value : null;
  const attrs = node.attributes as Record<string, unknown>;

  // ---------------------------------------------------------------------------
  // Derive relationships from edges
  // ---------------------------------------------------------------------------

  // For ASSET: which Vendor owns it?
  const ownerVendors = getNeighboursByEdgeType(edges, neighbours, "OWNED_BY_VENDOR", "from", node.id);

  // For ASSET: which Use Cases use it?
  const usingUseCases = getNeighboursByEdgeType(edges, neighbours, "USES_ASSET", "to", node.id)
    .concat(getNeighboursByEdgeType(edges, neighbours, "USES_MODEL", "to", node.id));

  // For ASSET: which Data Assets does it store?
  const storedDataAssets = getNeighboursByEdgeType(edges, neighbours, "STORES_DATA", "from", node.id);

  // For ASSET: which jurisdictions is it subject to?
  const jurisdictions = getNeighboursByEdgeType(edges, neighbours, "SUBJECT_TO", "from", node.id);

  // For VENDOR: which assets does it own?
  const ownedAssets = getNeighboursByEdgeType(edges, neighbours, "OWNED_BY_VENDOR", "to", node.id);

  // For USE_CASE: handled on its own detail page; link there
  const isUseCase = node.type === "USE_CASE";
  const isAsset   = node.type === "ASSET";
  const isVendor  = node.type === "VENDOR";
  const isDataAsset = node.type === "DATA_ASSET";

  // Parent asset for a DATA_ASSET
  const parentAssets = isDataAsset
    ? getNeighboursByEdgeType(edges, neighbours, "STORES_DATA", "to", node.id)
    : [];

  // Breadcrumb label
  const breadcrumbLabel = isUseCase ? "Use Cases" : "Inventory";
  const breadcrumbHref  = isUseCase ? "/use-cases" : "/inventory";

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#5c5248]">
        <Link href={breadcrumbHref} className="hover:text-[#9a9078] transition-colors">
          {breadcrumbLabel}
        </Link>
        {isAsset && ownerVendors[0] && (
          <>
            <span>/</span>
            <Link
              href={`/nodes/${encodeURIComponent(ownerVendors[0].id)}`}
              className="hover:text-[#9a9078] transition-colors"
            >
              {ownerVendors[0].label}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-[#9a9078]">{node.label}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#D9C8B4]">{node.label}</h1>
          <p className="text-xs text-[#5c5248] font-mono mt-1">{node.id}</p>
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

      {/* Use-case redirect hint */}
      {isUseCase && (
        <div className="flex gap-3 p-4 rounded-xl border border-[#8A9C8B33] bg-[#8A9C8B08]">
          <span className="text-[#9baf9c] flex-shrink-0">ℹ</span>
          <p className="text-xs text-[#9a9078]">
            This is a Use Case node.{" "}
            <Link
              href={`/use-cases/${encodeURIComponent(node.id)}`}
              className="text-[#8A9C8B] hover:underline font-medium"
            >
              View the full risk, compliance and dependency report →
            </Link>
          </p>
        </div>
      )}

      {/* Manual entry warning */}
      {node.source === "MANUAL" && (
        <div className="flex gap-3 p-4 rounded-xl border border-[#C4924A33] bg-[#C4924A08]">
          <span className="text-[#d4a456] flex-shrink-0">⚠</span>
          <p className="text-xs text-[#9a9078]">
            <span className="text-[#d4a456] font-medium">Manual entry — </span>
            this node was created manually and has not been corroborated by live telemetry.
            It will appear as a blind spot in coverage reports until a connector confirms it.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Context bar — key relationships at a glance                         */}
      {/* ------------------------------------------------------------------ */}
      {(ownerVendors.length > 0 || usingUseCases.length > 0 || ownedAssets.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {isAsset && ownerVendors[0] && (
            <Link
              href={`/nodes/${encodeURIComponent(ownerVendors[0].id)}`}
              className="flex flex-col p-3.5 rounded-xl border border-[#2a2825] bg-[#1e1c1a] hover:border-[#8A9C8B44] hover:bg-[#1e2420] transition-all group"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c5248] mb-1">Vendor</p>
              <p className="text-sm font-semibold text-[#D9C8B4] group-hover:text-[#c4d4c5] capitalize truncate">
                {ownerVendors[0].label}
              </p>
            </Link>
          )}
          {isAsset && (
            <div className="flex flex-col p-3.5 rounded-xl border border-[#2a2825] bg-[#1e1c1a]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c5248] mb-1">Used in</p>
              <p className="text-sm font-semibold text-[#D9C8B4]">
                {usingUseCases.length} use case{usingUseCases.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
          {isAsset && jurisdictions.length > 0 && (
            <div className="flex flex-col p-3.5 rounded-xl border border-[#2a2825] bg-[#1e1c1a]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c5248] mb-1">Jurisdiction</p>
              <p className="text-sm font-semibold text-[#D9C8B4] truncate">
                {jurisdictions.map((j) => j.label).join(", ")}
              </p>
            </div>
          )}
          {isAsset && typeof attrs.kind === "string" && (
            <div className="flex flex-col p-3.5 rounded-xl border border-[#2a2825] bg-[#1e1c1a]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c5248] mb-1">Kind</p>
              <p className="text-sm font-semibold text-[#D9C8B4] truncate">
                {attrs.kind.replace(/_/g, " ")}
              </p>
            </div>
          )}
          {isVendor && (
            <div className="flex flex-col p-3.5 rounded-xl border border-[#2a2825] bg-[#1e1c1a]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c5248] mb-1">Assets</p>
              <p className="text-sm font-semibold text-[#D9C8B4]">{ownedAssets.length}</p>
            </div>
          )}
          {isDataAsset && parentAssets[0] && (
            <Link
              href={`/nodes/${encodeURIComponent(parentAssets[0].id)}`}
              className="flex flex-col p-3.5 rounded-xl border border-[#2a2825] bg-[#1e1c1a] hover:border-[#8A9C8B44] hover:bg-[#1e2420] transition-all group col-span-2"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5c5248] mb-1">Stored in Asset</p>
              <p className="text-sm font-semibold text-[#D9C8B4] group-hover:text-[#c4d4c5] truncate">
                {parentAssets[0].label}
              </p>
            </Link>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Attributes                                                           */}
      {/* ------------------------------------------------------------------ */}
      {Object.keys(attrs).length > 0 && (
        <Card>
          <CardTitle>Attributes</CardTitle>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 mt-2">
            {Object.entries(attrs).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-[#5c5248] uppercase tracking-wide">{k}</dt>
                <dd className="text-sm text-[#D9C8B4] mt-0.5 font-mono break-all">
                  {typeof v === "object" ? JSON.stringify(v) : String(v)}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Relationship sections                                                */}
      {/* ------------------------------------------------------------------ */}

      {/* VENDOR → its assets */}
      {isVendor && (
        <RelationshipCard
          title="Assets"
          nodes={ownedAssets}
          emptyText="No assets linked to this vendor yet."
          hrefPrefix="/nodes"
        />
      )}

      {/* ASSET → the use cases it powers */}
      {isAsset && usingUseCases.length > 0 && (
        <RelationshipCard
          title="Used in Use Cases"
          nodes={usingUseCases}
          emptyText="No use cases reference this asset yet."
          hrefPrefix="/use-cases"
        />
      )}

      {/* ASSET → data assets it stores */}
      {isAsset && storedDataAssets.length > 0 && (
        <RelationshipCard
          title="Stores Data"
          nodes={storedDataAssets}
          emptyText=""
          hrefPrefix="/nodes"
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Evidence Trail                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardTitle>
          Evidence Trail {history ? `(${history.count} events)` : ""}
        </CardTitle>
        {!history || history.events.length === 0 ? (
          <EmptyState title="No events recorded yet" body="Events are appended automatically when this node is updated by a sync run." />
        ) : (
          <div className="space-y-1">
            {history.events.map((e) => (
              <div key={e.id} className="flex items-start gap-3 py-2 border-b border-[#2a2825] last:border-0">
                <span className="text-[#5c5248] text-xs w-36 flex-shrink-0 pt-0.5">
                  {new Date(e.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="text-sm">
                  <span className="text-[#9baf9c] font-medium">{e.type.replace(/_/g, " ")}</span>
                  <span className="text-[#5c5248] text-xs ml-2">by {e.actor}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
