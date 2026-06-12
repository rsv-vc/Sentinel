"use client";

interface CostCardProps {
  label: string;
  value: string;
  subtitle: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function CostCard({ label, value, subtitle, trend }: CostCardProps) {
  return (
    <div className="rounded-xl border border-[#2a2825] bg-[#1e1c1a] p-4">
      <p className="text-[11.5px] text-[#D9C8B4] font-medium">{label}</p>
      <p className="text-[28px] font-black text-[#D9C8B4] leading-none mt-2">{value}</p>

      {trend && (
        <div className="flex items-center gap-1 mt-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d={trend.isPositive ? "M6 8V2M2 6l4-2 4 2" : "M6 2v6M2 6l4 2 4-2"}
              stroke={trend.isPositive ? "#d4836e" : "#9baf9c"}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={`text-[10px] font-semibold ${trend.isPositive ? "text-[#d4836e]" : "text-[#9baf9c]"}`}>
            {trend.isPositive ? "+" : ""}{trend.value.toFixed(1)}%
          </span>
        </div>
      )}

      <p className="text-[10.5px] text-[#5c5248] mt-1">{subtitle}</p>
    </div>
  );
}
