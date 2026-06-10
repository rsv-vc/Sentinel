import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {icon && (
        <div className="mb-4 text-[#2a2825] opacity-80">
          {icon}
        </div>
      )}
      <p className="text-[14px] font-semibold text-[#4a4438] mb-1.5">{title}</p>
      {body && (
        <p className="text-[12.5px] text-[#3a3430] max-w-xs leading-relaxed">{body}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function EmptyIconList() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <rect x="6" y="8" width="28" height="24" rx="4" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="12" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="20" x2="24" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="24" x2="20" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function EmptyIconGraph() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="32" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="20" cy="33" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="10.5" y1="12" x2="17" y2="17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="29.5" y1="12" x2="23" y2="17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="20" y1="24" x2="20" y2="30" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

export function EmptyIconShield() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d="M20 4L34 9.5V20C34 28.5 27 34.5 20 37C13 34.5 6 28.5 6 20V9.5L20 4Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 20l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function EmptyIconActivity() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d="M2 20h7l5-12 8 24 6-18 4 6h6"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
