"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmNode } from "@/lib/api";

export function ConfirmButton({ nodeId }: { nodeId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const router = useRouter();

  async function handleConfirm() {
    setState("loading");
    try {
      await confirmNode(nodeId, "user");
      setState("done");
      router.refresh();
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  if (state === "done") {
    return (
      <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#22c55e22] text-[#4ade80] border border-[#22c55e33]">
        Confirmed ✓
      </span>
    );
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={state === "loading"}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        state === "error"
          ? "bg-[#ef444422] text-[#f87171] border border-[#ef444433]"
          : "bg-[#f59e0b22] text-[#fbbf24] border border-[#f59e0b33] hover:bg-[#f59e0b33]"
      }`}
    >
      {state === "loading" ? "Confirming…" : state === "error" ? "Error — retry?" : "Confirm this node"}
    </button>
  );
}
