"use client";

import { useEffect, useState } from "react";

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function timeUntil(isoDate: string): string {
  const diffMs = new Date(isoDate).getTime() - Date.now();
  if (diffMs <= 0) return "now";
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `in ${s}s`;
  return `in ${Math.floor(s / 60)}m`;
}

export function LiveSyncTicker({
  running,
  lastSyncAt,
  nextRunAt,
  totalRuns,
  intervalMs,
}: {
  running:    boolean;
  lastSyncAt: string | null;
  nextRunAt:  string | null;
  totalRuns:  number;
  intervalMs: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Pulse dot */}
      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${running ? "bg-[#8A9C8B]" : "bg-[#3a3430]"}`} />
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${running ? "bg-[#8A9C8B]" : "bg-[#3a3430]"}`} />
      </span>

      <div className="flex items-center gap-2 text-[12px] text-[#5c5248] flex-wrap">
        <span className={running ? "text-[#9baf9c] font-semibold" : "text-[#5c5248]"}>
          {running ? "Syncing" : "Idle"}
        </span>
        <span className="text-[#2a2825]">·</span>
        <span><span className="text-[#D9C8B4] font-semibold">{totalRuns}</span> runs</span>
        <span className="text-[#2a2825]">·</span>
        <span>every <span className="text-[#D9C8B4] font-semibold">{intervalMs / 1000}s</span></span>
        {mounted && lastSyncAt && (
          <>
            <span className="text-[#2a2825]">·</span>
            <span>last <span className="text-[#D9C8B4] font-semibold">{timeAgo(lastSyncAt)}</span></span>
          </>
        )}
        {mounted && nextRunAt && (
          <>
            <span className="text-[#2a2825]">·</span>
            <span>next <span className="text-[#8A9C8B] font-semibold">{timeUntil(nextRunAt)}</span></span>
          </>
        )}
      </div>
    </div>
  );
}
