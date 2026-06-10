import React from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        {eyebrow && (
          <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#5c5248] mb-1.5">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[21px] font-bold tracking-tight text-[#D9C8B4] leading-tight">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-[13px] text-[#4a4438] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          {actions}
        </div>
      )}
    </div>
  );
}
