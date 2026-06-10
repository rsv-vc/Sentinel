import type { Metadata } from "next";
import { Card, CardTitle } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Settings" };

function Toggle({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#2a2825] last:border-0">
      <span className="text-[13px] text-[#9a9078]">{label}</span>
      <div className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? "bg-[#8A9C8B]" : "bg-[#2a2825]"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#D9C8B4] shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader eyebrow="Account" title="Settings" subtitle="Configure your Sentinel workspace preferences." />

      {/* Notifications */}
      <Card>
        <CardTitle>Notifications</CardTitle>
        <div className="mt-2">
          <Toggle enabled={true}  label="Low-confidence node alerts" />
          <Toggle enabled={true}  label="Sync completed notifications" />
          <Toggle enabled={false} label="Weekly digest email" />
          <Toggle enabled={false} label="Compliance gap warnings" />
        </div>
      </Card>

      {/* Sync */}
      <Card>
        <CardTitle>Sync & Connectors</CardTitle>
        <div className="mt-3 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#D9C8B4] font-medium">Auto-sync interval</p>
              <p className="text-[11.5px] text-[#5c5248] mt-0.5">How often Sentinel polls connectors for changes</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2825] bg-[#1a1918] text-[12.5px] text-[#9a9078]">
              Every 15 min
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[#3a3430]">
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#D9C8B4] font-medium">Confidence threshold</p>
              <p className="text-[11.5px] text-[#5c5248] mt-0.5">Nodes below this level are flagged for review</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2825] bg-[#1a1918] text-[12.5px] text-[#9a9078]">
              Medium
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-[#3a3430]">
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </Card>

      {/* Display */}
      <Card>
        <CardTitle>Display</CardTitle>
        <div className="mt-2">
          <Toggle enabled={true}  label="Show node IDs in inventory" />
          <Toggle enabled={true}  label="Compact evidence trail" />
          <Toggle enabled={false} label="Show vendor logos" />
        </div>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardTitle>Data & Privacy</CardTitle>
        <div className="mt-2">
          <Toggle enabled={true}  label="Anonymise emails in reports" />
          <Toggle enabled={false} label="Include raw telemetry in exports" />
        </div>
      </Card>

      {/* Danger zone */}
      <Card>
        <CardTitle>Danger Zone</CardTitle>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-[#C86F5820] bg-[#C86F5806]">
            <div>
              <p className="text-[13px] text-[#d4836e] font-medium">Reset graph</p>
              <p className="text-[11.5px] text-[#5c5248] mt-0.5">Wipe all nodes and edges — requires re-sync</p>
            </div>
            <button className="px-3 py-1.5 text-[12px] font-medium text-[#d4836e] border border-[#C86F5840] rounded-lg hover:bg-[#C86F5815] transition-colors">
              Reset
            </button>
          </div>
        </div>
      </Card>

      <p className="text-[11px] text-[#3a3430] text-center pb-4">
        Settings are UI-only in this prototype — persistence coming in v0.2
      </p>
    </div>
  );
}
