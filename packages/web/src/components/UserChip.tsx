"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/api";

const ROLE_COLOR: Record<string, string> = {
  ADMIN:   "text-[#d4836e] bg-[#C86F5818] border-[#C86F5830]",
  ANALYST: "text-[#9baf9c] bg-[#8A9C8B18] border-[#8A9C8B30]",
  VIEWER:  "text-[#9a9078] bg-[#9a907818] border-[#9a907830]",
};

export function UserChip({ email, role }: { email: string; role: string }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutUser();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${ROLE_COLOR[role] ?? ROLE_COLOR.VIEWER}`}>
        {role}
      </span>
      <span className="text-xs text-[#9a9078] hidden sm:block">{email}</span>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="text-xs text-[#5c5248] hover:text-[#d4836e] transition-colors disabled:opacity-40"
        title="Sign out"
      >
        {loggingOut ? "…" : "↩"}
      </button>
    </div>
  );
}
