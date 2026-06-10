"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Flag { vendorLabel: string; portfolioShare: number; useCaseCount: number; }

const DISMISSED_KEY = "sentinel_concentration_dismissed";

export function ConcentrationBanner({ flags }: { flags: Flag[] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (!dismissed && flags.length > 0) setVisible(true);
  }, [flags.length]);

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const topFlag = flags[0];

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-[#C4924A40] bg-[#C4924A08]">
      <span className="text-[#d4a456] flex-shrink-0 mt-0.5">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L14.5 13H1.5L8 2Z" stroke="#d4a456" strokeWidth="1.4" strokeLinejoin="round"/>
          <line x1="8" y1="6.5" x2="8" y2="9.5" stroke="#d4a456" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="8" cy="11.5" r="0.7" fill="#d4a456"/>
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#d4a456]">Vendor concentration risk detected</p>
        <p className="text-[12px] text-[#5c5248] mt-0.5 leading-relaxed">
          <span className="text-[#D9C8B4] font-semibold">{topFlag.vendorLabel}</span> appears in{" "}
          <span className="text-[#d4a456] font-semibold">{topFlag.portfolioShare}%</span> of use-cases
          ({topFlag.useCaseCount} of {Math.round(topFlag.useCaseCount / (topFlag.portfolioShare / 100))}).
          {flags.length > 1 && ` Plus ${flags.length - 1} other vendor${flags.length > 2 ? "s" : ""}.`}
          {" "}Consider diversifying critical AI capabilities.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/reports"
          className="text-[12px] text-[#d4a456] border border-[#C4924A35] px-2.5 py-1 rounded-lg hover:bg-[#C4924A12] transition-colors"
        >
          View report
        </Link>
        <button
          onClick={dismiss}
          className="text-[#3a3430] hover:text-[#9a9078] text-xl leading-none transition-colors"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
