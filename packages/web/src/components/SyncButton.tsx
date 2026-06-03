"use client";

import { useState } from "react";
import { triggerSync } from "@/lib/api";

export function SyncButton() {
  const [state, setState] = useState<"idle" | "syncing" | "done" | "error">("idle");

  async function handleSync() {
    setState("syncing");
    try {
      await triggerSync();
      setState("done");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  const labels = { idle: "Sync Now", syncing: "Syncing…", done: "Synced ✓", error: "Error — retry?" };
  const colors = {
    idle:    "bg-[#6366f1] hover:bg-[#4f46e5] text-white",
    syncing: "bg-[#6366f144] text-[#a5b4fc] cursor-not-allowed",
    done:    "bg-[#22c55e22] text-[#4ade80] border border-[#22c55e33]",
    error:   "bg-[#ef444422] text-[#f87171] border border-[#ef444433]",
  };

  return (
    <button
      onClick={handleSync}
      disabled={state === "syncing"}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${colors[state]}`}
    >
      {labels[state]}
    </button>
  );
}
