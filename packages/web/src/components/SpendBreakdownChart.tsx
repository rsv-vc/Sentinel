"use client";

import { useEffect, useState } from "react";

interface Bar {
  label: string;
  value: number;
  color: string;
  sublabel?: string;
}

export function SpendBreakdownChart({ bars, total }: { bars: Bar[]; total: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="space-y-2.5">
      {bars.map((bar) => {
        const pct = (bar.value / max) * 100;
        const sharePct = total > 0 ? Math.round((bar.value / total) * 100) : 0;
        return (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="text-[12px] font-medium text-[#D9C8B4]">{bar.label}</span>
                {bar.sublabel && <span className="text-[10px] text-[#5c5248] ml-1.5">{bar.sublabel}</span>}
              </div>
              <div className="text-right">
                <span className="text-[12px] font-semibold" style={{ color: bar.color }}>{fmt(bar.value)}</span>
                <span className="text-[10px] text-[#5c5248] ml-1">{sharePct}%</span>
              </div>
            </div>
            <div className="h-2 bg-[#2a2825] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: animated ? `${pct}%` : "0%",
                  background: bar.color,
                  boxShadow: `0 0 8px ${bar.color}55`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({
  segments,
  centerLabel,
  centerSub,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  centerLabel: string;
  centerSub: string;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 150); return () => clearTimeout(t); }, []);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const R = 52;
  const stroke = 12;
  const circ = 2 * Math.PI * R;
  const cx = 72, cy = 72;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const frac = seg.value / total;
    const dash = animated ? frac * circ : 0;
    const gap  = circ - dash;
    const rotation = offset * 360 - 90;
    offset += frac;
    return { ...seg, dash, gap, rotation, frac };
  });

  return (
    <div className="flex items-center gap-5">
      <div className="flex-shrink-0">
        <svg width="144" height="144" viewBox="0 0 144 144">
          {/* Track */}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#2a2825" strokeWidth={stroke} />
          {/* Segments */}
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={0}
              transform={`rotate(${arc.rotation} ${cx} ${cy})`}
              style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 4px ${arc.color}44)` }}
            />
          ))}
          {/* Center */}
          <text x={cx} y={cy - 5} textAnchor="middle" fill="#D9C8B4" fontSize="15" fontWeight="900" fontFamily="var(--font-inter, system-ui)">
            {centerLabel}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="#5c5248" fontSize="9" fontFamily="var(--font-inter, system-ui)">
            {centerSub}
          </text>
        </svg>
      </div>
      <div className="space-y-2 flex-1">
        {arcs.map((arc) => (
          <div key={arc.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: arc.color }} />
              <span className="text-[11.5px] text-[#9a9078]">{arc.label}</span>
            </div>
            <span className="text-[11px] text-[#5c5248] font-mono">{Math.round(arc.frac * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
