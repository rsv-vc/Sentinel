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
      <span className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[#8A9C8B18] text-[#9baf9c] border border-[#8A9C8B35]">
        Confirmed ✓
      </span>
    );
  }

  return (
    <button
      onClick={handleConfirm}
      disabled={state === "loading"}
      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
        state === "error"
          ? "bg-[#C86F5818] text-[#d4836e] border border-[#C86F5835]"
          : "bg-[#C4924A18] text-[#d4a456] border border-[#C4924A35] hover:bg-[#C4924A25]"
      }`}
    >
      {state === "loading" ? "Confirming…" : state === "error" ? "Error — retry?" : "Confirm this node"}
    </button>
  );
}
