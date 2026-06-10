import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Coverage" };

export default function CoveragePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assess"
        title="Coverage"
        subtitle="Estate coverage scoring, blind-spot detection, and insurance-grade telemetry."
      />

      {/* Coming soon card */}
      <div className="rounded-2xl border border-[#2a2825] bg-[#1e1c1a] overflow-hidden">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-[#8A9C8B] via-[#C4924A] to-[#C86F58]" />

        <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-6">
          {/* Icon */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-[#1e2420] border border-[#8A9C8B25] flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path
                  d="M18 3L33 9V21C33 28.5 26 33.5 18 36C10 33.5 3 28.5 3 21V9L18 3Z"
                  stroke="#8A9C8B" strokeWidth="2" strokeLinejoin="round" fill="none"
                />
                <path d="M11 18l5 5 9-9" stroke="#8A9C8B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Pulse ring */}
            <span className="absolute -inset-1 rounded-2xl border border-[#8A9C8B20] animate-ping" style={{ animationDuration: "3s" }} />
          </div>

          {/* Text */}
          <div className="space-y-2 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C4924A12] border border-[#C4924A30] mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a96a] animate-pulse" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#d4a96a]">Coming Soon</span>
            </div>
            <h2 className="text-[22px] font-black text-[#D9C8B4] leading-tight">
              Coverage &amp; Insurance Insights
            </h2>
            <p className="text-[13px] text-[#9a9078] leading-relaxed">
              Full estate coverage scoring, blind-spot detection, and insurance-grade telemetry are on the roadmap.
              This module will require integration with Insurance APIs to score your AI coverage posture.
            </p>
          </div>

          {/* Feature preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl mt-2">
            {[
              { icon: "📊", title: "Coverage Score",      desc: "Real-time % of AI estate with active monitoring" },
              { icon: "🔍", title: "Blind Spot Detection", desc: "Assets and use cases without telemetry coverage"  },
              { icon: "🛡️", title: "Insurance Mapping",   desc: "Map coverage gaps to insurance policy requirements" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#2a2825] bg-[#191817]">
                <span className="text-2xl">{icon}</span>
                <p className="text-[12px] font-semibold text-[#9a9078]">{title}</p>
                <p className="text-[10.5px] text-[#5c5248] text-center leading-snug">{desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 mt-2">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg bg-[#8A9C8B] text-[#1a1918] text-[12.5px] font-semibold hover:bg-[#9baf9c] transition-colors"
            >
              Back to Dashboard
            </Link>
            <a
              href="mailto:support@sentinel.ai?subject=Coverage+Module+Interest"
              className="px-5 py-2.5 rounded-lg border border-[#2a2825] text-[#9a9078] text-[12.5px] font-medium hover:text-[#D9C8B4] hover:border-[#3a3835] transition-colors"
            >
              Express Interest
            </a>
          </div>
        </div>
      </div>

      {/* Current basic stats (from existing data) */}
      <p className="text-[11px] text-[#3a3430] text-center">
        Basic coverage indicators are visible on the{" "}
        <Link href="/" className="text-[#8A9C8B] hover:text-[#9baf9c] transition-colors">Dashboard</Link>
        {" "}until the full Coverage module launches.
      </p>
    </div>
  );
}
