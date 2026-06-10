import React from "react";

type CardVariant = "default" | "elevated" | "ghost" | "accent";

const VARIANT: Record<CardVariant, string> = {
  default:  "bg-[#242220] border border-[#2a2825]",
  elevated: "bg-[#242220] border border-[#363330] shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
  ghost:    "bg-transparent border border-[#2a2825]",
  accent:   "bg-[#242220] border border-[#2a2825] border-l-[3px] border-l-[#8A9C8B]",
};

export function Card({
  children,
  className = "",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
}) {
  return (
    <div className={`rounded-xl p-5 ${VARIANT[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10.5px] font-bold text-[#3a3430] uppercase tracking-[0.09em]">
      {children}
    </h2>
  );
}

export function Stat({
  label,
  value,
  valueClassName = "text-[#D9C8B4]",
  sub,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  sub?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10.5px] font-medium text-[#3a3430] uppercase tracking-[0.08em] mb-1">{label}</p>
      <p className={`text-[28px] font-black leading-none font-tabular ${valueClassName}`}>{value}</p>
      {sub && <p className="text-[11px] text-[#5c5248] mt-1">{sub}</p>}
    </div>
  );
}
