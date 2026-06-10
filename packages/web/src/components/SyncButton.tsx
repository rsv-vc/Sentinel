"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { triggerSync } from "@/lib/api";

export function SyncButton() {
  const [state, setState] = useState<"idle" | "syncing" | "done" | "error">("idle");
  const router = useRouter();

  async function handleSync() {
    setState("syncing");
    try {
      await triggerSync();
      setState("done");
      setTimeout(() => { setState("idle"); router.refresh(); }, 1500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  const config = {
    idle:    { label: "Sync Now",       classes: "bg-[#8A9C8B] hover:bg-[#7a8c7b] text-[#1a1918] border-transparent font-semibold" },
    syncing: { label: "Syncing…",      classes: "bg-[#8A9C8B18] text-[#9baf9c] border-[#8A9C8B35] cursor-not-allowed" },
    done:    { label: "Synced ✓",      classes: "bg-[#8A9C8B18] text-[#9baf9c] border-[#8A9C8B35]" },
    error:   { label: "Error — retry?", classes: "bg-[#C86F5818] text-[#d4836e] border-[#C86F5835]" },
  };

  const { label, classes } = config[state];

  return (
    <button
      onClick={handleSync}
      disabled={state === "syncing"}
      className={`px-4 py-2 rounded-lg text-[13px] border transition-all ${classes}`}
    >
      {label}
    </button>
  );
}
