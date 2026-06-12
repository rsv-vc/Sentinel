import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

export const metadata: Metadata = { title: "Recent Changes" };

const EVENT_CONFIG: Record<string, { label: string; color: string; icon: string; highlight?: boolean }> = {
  NODE_CREATED:                { label: "New node discovered",    color: "text-[#9baf9c]", icon: "✦", highlight: true },
  NODE_UPDATED:                { label: "Node updated",           color: "text-[#9baf9c]", icon: "↻" },
  NODE_FLAGGED_LOW_CONFIDENCE: { label: "Flagged — needs review", color: "text-[#d4a456]", icon: "⚠", highlight: true },
  NODE_CONFIRMED:              { label: "Node confirmed",         color: "text-[#9baf9c]", icon: "✓" },
  EDGE_CREATED:                { label: "New relationship",       color: "text-[#9baf9c]", icon: "⟶" },
};

const mockGroups = [
  {
    runLabel: "Sync run — 18:00:00",
    newDiscoveries: 3,
    flagged: 1,
    nodesUpserted: 8,
    edgesUpserted: 5,
    events: [
      { id: "e1", type: "NODE_CREATED",                nodeId: "a-claude",       time: "18:00:12" },
      { id: "e2", type: "NODE_CREATED",                nodeId: "a-gpt4",         time: "18:00:13" },
      { id: "e3", type: "NODE_CREATED",                nodeId: "v-anthropic",    time: "18:00:14" },
      { id: "e4", type: "NODE_FLAGGED_LOW_CONFIDENCE", nodeId: "a-gpu",          time: "18:00:15" },
      { id: "e5", type: "EDGE_CREATED",                nodeId: "a-claude→uc-1",  time: "18:00:16" },
    ],
  },
  {
    runLabel: "Sync run — 17:00:00",
    newDiscoveries: 2,
    flagged: 0,
    nodesUpserted: 4,
    edgesUpserted: 3,
    events: [
      { id: "e6", type: "NODE_CREATED",  nodeId: "uc-3",        time: "17:00:08" },
      { id: "e7", type: "NODE_UPDATED",  nodeId: "v-openai",    time: "17:00:09" },
      { id: "e8", type: "NODE_CONFIRMED",nodeId: "a-bedrock",   time: "17:00:10" },
    ],
  },
];

export default function ChangesPage() {
  const totalNew     = mockGroups.reduce((s, g) => s + g.newDiscoveries, 0);
  const totalFlagged = mockGroups.reduce((s, g) => s + g.flagged, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Changes"
        subtitle="Append-only event feed — grouped by sync run"
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2825] bg-[#1e1c1a] text-[12.5px]">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#2a2825]" />
            <span className="text-[#5c5248]">{mockGroups.length} runs · every 300s</span>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-[#5c5248] uppercase tracking-wide mb-1">Sync Runs</p>
          <p className="text-3xl font-black text-[#D9C8B4]">{mockGroups.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#5c5248] uppercase tracking-wide mb-1">New Discoveries</p>
          <p className="text-3xl font-black text-[#9baf9c]">{totalNew}</p>
        </Card>
        <Card>
          <p className="text-xs text-[#5c5248] uppercase tracking-wide mb-1">Flagged for Review</p>
          <p className={`text-3xl font-black ${totalFlagged > 0 ? "text-[#d4a456]" : "text-[#D9C8B4]"}`}>{totalFlagged}</p>
        </Card>
      </div>

      <div className="space-y-4">
        {mockGroups.map((group, gi) => (
          <Card key={gi}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-[#5c5248] text-sm">⟳</span>
                <span className="text-sm font-semibold text-[#9a9078]">{group.runLabel}</span>
                <span className="text-xs text-[#5c5248]">{group.nodesUpserted} nodes · {group.edgesUpserted} edges</span>
              </div>
              <div className="flex gap-2">
                {group.newDiscoveries > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#8A9C8B18] text-[#9baf9c] border border-[#8A9C8B30]">
                    +{group.newDiscoveries} new
                  </span>
                )}
                {group.flagged > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#C4924A18] text-[#d4a456] border border-[#C4924A30]">
                    {group.flagged} flagged
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              {group.events.map((evt) => {
                const cfg = EVENT_CONFIG[evt.type] ?? { label: evt.type, color: "text-[#9a9078]", icon: "·" };
                return (
                  <div
                    key={evt.id}
                    className={`flex items-start gap-3 py-1.5 px-2 rounded-lg text-sm ${cfg.highlight ? "bg-[#1e2420] border border-[#2a2825]" : ""}`}
                  >
                    <span className={`${cfg.color} flex-shrink-0 w-4 text-center`}>{cfg.icon}</span>
                    <span className={`${cfg.color} font-medium flex-shrink-0 w-44`}>{cfg.label}</span>
                    <span className="text-[#8A9C8B] font-mono text-xs truncate">{evt.nodeId}</span>
                    <span className="text-[#5c5248] text-xs ml-auto flex-shrink-0">{evt.time}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
