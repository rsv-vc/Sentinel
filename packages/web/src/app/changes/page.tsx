import type { Metadata } from "next";
import Link from "next/link";
import { getRecentEvents, getSyncStatus } from "@/lib/api";
import { Card, CardTitle } from "@/components/Card";
import type { EventDTO } from "@/lib/api";

export const metadata: Metadata = { title: "Recent Changes" };

// ---------------------------------------------------------------------------
// Event type → display config
// ---------------------------------------------------------------------------

const EVENT_CONFIG: Record<string, { label: string; color: string; icon: string; highlight?: boolean }> = {
  NODE_CREATED:               { label: "New node discovered",       color: "text-[#4ade80]",  icon: "✦", highlight: true },
  NODE_UPDATED:               { label: "Node updated",              color: "text-[#a5b4fc]",  icon: "↻" },
  NODE_FLAGGED_LOW_CONFIDENCE:{ label: "Flagged — needs review",    color: "text-[#fbbf24]",  icon: "⚠", highlight: true },
  NODE_CONFIRMED:             { label: "Node confirmed",            color: "text-[#4ade80]",  icon: "✓" },
  EDGE_CREATED:               { label: "New relationship",          color: "text-[#818cf8]",  icon: "⟶" },
  EDGE_REMOVED:               { label: "Relationship removed",      color: "text-[#f87171]",  icon: "✕" },
  SYNC_COMPLETED:             { label: "Sync completed",            color: "text-[#5b5b70]",  icon: "⟳" },
};

// ---------------------------------------------------------------------------
// Group events by SYNC_COMPLETED boundaries
// ---------------------------------------------------------------------------

interface SyncGroup {
  syncEvent: EventDTO | null;
  runLabel: string;
  events: EventDTO[];
  newDiscoveries: number;
  flagged: number;
}

function groupBySyncRun(events: EventDTO[]): SyncGroup[] {
  const groups: SyncGroup[] = [];
  let current: EventDTO[] = [];

  // Events come back newest-first; reverse to process oldest-first for grouping
  const ordered = [...events].reverse();

  for (const evt of ordered) {
    if (evt.type === "SYNC_COMPLETED") {
      if (current.length > 0 || groups.length === 0) {
        const payload = evt.payload as Record<string, unknown>;
        groups.push({
          syncEvent: evt,
          runLabel: `Sync run — ${new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
          events: current,
          newDiscoveries: current.filter((e) => e.type === "NODE_CREATED").length,
          flagged: current.filter((e) => e.type === "NODE_FLAGGED_LOW_CONFIDENCE").length,
        });
        current = [];
      }
    } else {
      current.push(evt);
    }
  }

  // Any trailing events not yet closed by SYNC_COMPLETED
  if (current.length > 0) {
    groups.push({
      syncEvent: null,
      runLabel: "In progress…",
      events: current,
      newDiscoveries: current.filter((e) => e.type === "NODE_CREATED").length,
      flagged: current.filter((e) => e.type === "NODE_FLAGGED_LOW_CONFIDENCE").length,
    });
  }

  return groups.reverse(); // most recent first
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ChangesPage() {
  const [eventsResult, statusResult] = await Promise.allSettled([
    getRecentEvents(200),
    getSyncStatus(),
  ]);

  const events = eventsResult.status === "fulfilled" ? eventsResult.value.data : [];
  const syncStatus = statusResult.status === "fulfilled" ? statusResult.value : null;
  const groups = groupBySyncRun(events);

  const totalNew = groups.reduce((s, g) => s + g.newDiscoveries, 0);
  const totalFlagged = groups.reduce((s, g) => s + g.flagged, 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#e4e4f0]">Recent Changes</h1>
          <p className="text-[#8b8ba8] text-sm mt-1">
            Live event feed — grouped by sync run · auto-refreshes on page reload
          </p>
        </div>

        {/* Scheduler status pill */}
        {syncStatus && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#2a2a38] bg-[#111118] text-sm">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${syncStatus.running ? "bg-[#22c55e] shadow-[0_0_6px_#22c55e]" : "bg-[#5b5b70]"}`} />
            <span className="text-[#8b8ba8]">
              Sync {syncStatus.running ? "running" : "stopped"} ·{" "}
              <span className="text-[#e4e4f0]">{syncStatus.totalRuns}</span> runs ·{" "}
              every <span className="text-[#e4e4f0]">{syncStatus.intervalMs / 1000}s</span>
            </span>
          </div>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-[#5b5b70] uppercase tracking-wide mb-1">Sync Runs</p>
          <p className="text-3xl font-black text-[#e4e4f0]">{syncStatus?.totalRuns ?? groups.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#5b5b70] uppercase tracking-wide mb-1">New Discoveries</p>
          <p className="text-3xl font-black text-[#4ade80]">{totalNew}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#5b5b70] uppercase tracking-wide mb-1">Flagged for Review</p>
          <p className={`text-3xl font-black ${totalFlagged > 0 ? "text-[#fbbf24]" : "text-[#e4e4f0]"}`}>{totalFlagged}</p>
        </Card>
      </div>

      {/* Connector status */}
      {syncStatus && syncStatus.connectors.length > 0 && (
        <Card>
          <CardTitle>Connector Status</CardTitle>
          <div className="space-y-2">
            {syncStatus.connectors.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === "idle" ? "bg-[#22c55e]" : c.status === "syncing" ? "bg-[#6366f1] animate-pulse" : c.status === "error" ? "bg-[#ef4444]" : "bg-[#5b5b70]"}`} />
                  <span className="text-[#e4e4f0] font-medium">{c.name}</span>
                </div>
                <div className="flex items-center gap-4 text-[#5b5b70] text-xs">
                  <span>Run #{c.currentRun}</span>
                  {c.lastSyncAt && (
                    <span>Last sync {new Date(c.lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                  )}
                  {syncStatus.nextRunAt && (
                    <span>Next: {new Date(syncStatus.nextRunAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Event groups */}
      {groups.length === 0 ? (
        <Card>
          <p className="text-sm text-[#5b5b70] text-center py-8">
            No events yet — the background scheduler will populate this automatically.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group, gi) => (
            <Card key={gi}>
              {/* Group header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-[#5b5b70] text-sm">⟳</span>
                  <span className="text-sm font-semibold text-[#8b8ba8]">{group.runLabel}</span>
                  {group.syncEvent && (
                    <span className="text-xs text-[#5b5b70]">
                      {(group.syncEvent.payload as Record<string, unknown>)?.nodesUpserted as number ?? 0} nodes ·{" "}
                      {(group.syncEvent.payload as Record<string, unknown>)?.edgesUpserted as number ?? 0} edges
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {group.newDiscoveries > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#22c55e22] text-[#4ade80] border border-[#22c55e33]">
                      +{group.newDiscoveries} new
                    </span>
                  )}
                  {group.flagged > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#f59e0b22] text-[#fbbf24] border border-[#f59e0b33]">
                      {group.flagged} flagged
                    </span>
                  )}
                </div>
              </div>

              {/* Events in this group */}
              {group.events.length === 0 ? (
                <p className="text-xs text-[#5b5b70]">No node changes in this run.</p>
              ) : (
                <div className="space-y-1">
                  {group.events.map((evt) => {
                    const cfg = EVENT_CONFIG[evt.type] ?? { label: evt.type, color: "text-[#8b8ba8]", icon: "·" };
                    return (
                      <div
                        key={evt.id}
                        className={`flex items-start gap-3 py-1.5 px-2 rounded-lg text-sm ${cfg.highlight ? "bg-[#111120] border border-[#2a2a38]" : ""}`}
                      >
                        <span className={`${cfg.color} flex-shrink-0 w-4 text-center`}>{cfg.icon}</span>
                        <span className={`${cfg.color} font-medium flex-shrink-0 w-44`}>{cfg.label}</span>
                        {evt.nodeId ? (
                          <Link
                            href={`/nodes/${encodeURIComponent(evt.nodeId)}`}
                            className="text-[#6366f1] hover:text-[#818cf8] font-mono text-xs truncate hover:underline"
                          >
                            {evt.nodeId}
                          </Link>
                        ) : (
                          <span className="text-[#5b5b70] text-xs">—</span>
                        )}
                        <span className="text-[#5b5b70] text-xs ml-auto flex-shrink-0">
                          {new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
