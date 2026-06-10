"use client";

import { useEffect, useState } from "react";

export function EstateHealthGauge({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start    = performance.now();
    const duration = 900;
    const frame = (now: number) => {
      const t    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(ease * score));
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [score]);

  const R    = 80;
  const cx   = 120;
  const cy   = 100;
  const circ = Math.PI * R;
  const fill = (display / 100) * circ;

  // Warm palette: sage (good) → amber → terracotta (poor)
  const color = display >= 80 ? "#8A9C8B" : display >= 50 ? "#C4924A" : "#C86F58";
  const label = display >= 80 ? "Strong" : display >= 50 ? "Moderate" : "At Risk";

  return (
    <div className="flex flex-col items-center select-none">
      <svg width="240" height="120" viewBox="0 0 240 120">
        {/* Track */}
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none" stroke="#2a2825" strokeWidth="14" strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)`, transition: "stroke 0.3s" }}
        />
        {/* Score */}
        <text x={cx} y={cy - 10} textAnchor="middle" fill={color}
          fontSize="34" fontWeight="900" fontFamily="var(--font-inter, system-ui)">
          {display}%
        </text>
        {/* Label */}
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#5c5248"
          fontSize="11" fontFamily="var(--font-inter, system-ui)">
          {label} coverage
        </text>
        {/* Scale */}
        <text x={cx - R - 14} y={cy + 4} textAnchor="end" fill="#6b6358" fontSize="10" fontWeight="500">0</text>
        <text x={cx + R + 14} y={cy + 4} textAnchor="start" fill="#6b6358" fontSize="10" fontWeight="500">100</text>
      </svg>
      <p className="text-[11.5px] text-[#5c5248] -mt-2 text-center">Estate coverage score</p>
    </div>
  );
}
