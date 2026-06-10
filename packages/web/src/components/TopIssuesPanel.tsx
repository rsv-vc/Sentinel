import Link from "next/link";

interface TopIssue {
  kind:       "risk" | "compliance" | "coverage";
  icon:       string;
  title:      string;
  subtitle:   string;
  badge:      string;
  badgeColor: string;
  href:       string;
  cta:        string;
}

export function TopIssuesPanel({ issues }: { issues: TopIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-[#9baf9c]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="#9baf9c" strokeWidth="1.3"/>
          <path d="M4.5 7L6.2 8.8L9.5 5.5" stroke="#9baf9c" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        No critical issues detected in current graph.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {issues.map((issue, i) => (
        <Link
          key={i}
          href={issue.href}
          className="flex items-start gap-4 p-4 rounded-xl border border-[#2a2825] hover:border-[#8A9C8B28] hover:bg-[#252320] transition-all group card-interactive"
        >
          {/* Icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#1e1c1a] border border-[#2a2825] flex items-center justify-center text-base">
            {issue.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[13.5px] font-semibold text-[#D9C8B4] group-hover:text-[#c4d4c5] transition-colors truncate">
                {issue.title}
              </span>
              <span className={`text-[10.5px] px-1.5 py-[2px] rounded-full font-semibold flex-shrink-0 border ${issue.badgeColor}`}>
                {issue.badge}
              </span>
            </div>
            <p className="text-[12px] text-[#5c5248] leading-relaxed line-clamp-2">{issue.subtitle}</p>
          </div>

          {/* CTA arrow */}
          <span className="text-[12px] text-[#8A9C8B] flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {issue.cta} →
          </span>
        </Link>
      ))}
    </div>
  );
}
