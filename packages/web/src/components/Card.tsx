import React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[#111118] border border-[#2a2a38] rounded-xl p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-[#8b8ba8] uppercase tracking-wider mb-4">
      {children}
    </h2>
  );
}
