"use client";

/**
 * AppShell — client component.
 * Sidebar navigation for authenticated routes; passthrough on /login.
 * User data arrives as a prop from the server layout (server-side cookie read).
 *
 * Palette: Sage #8A9C8B · Terracotta #C86F58 · Sandstone #D9C8B4 · Charcoal #3A3A3A
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { logoutUser } from "@/lib/api";
import { ThemeToggle } from "./ThemeToggle";

// ─────────────────────────────────────────────────────────────────────────────
// Icons — 14×14 SVG, currentColor
// ─────────────────────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="1" width="5" height="5" rx="1.2" fill="currentColor"/>
      <rect x="8" y="1" width="5" height="5" rx="1.2" fill="currentColor"/>
      <rect x="1" y="8" width="5" height="5" rx="1.2" fill="currentColor"/>
      <rect x="8" y="8" width="5" height="5" rx="1.2" fill="currentColor"/>
    </svg>
  );
}


function IconShield() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 1L12.5 3.2V7.5C12.5 10.5 9.5 12.8 7 13.5C4.5 12.8 1.5 10.5 1.5 7.5V3.2L7 1Z"
        stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <ellipse cx="7" cy="7" rx="2.5" ry="5.5" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="1.5" y1="5" x2="12.5" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="1.5" y1="9" x2="12.5" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconDocument() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2.5 1.5h6L12 5v7.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V2a.5.5 0 01.5-.5z"
        stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M8.5 1.5V5H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="4" y1="7.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4" y1="9.8" x2="8" y2="9.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconSignOut() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M5 2.5H3a1 1 0 00-1 1v7a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M9.5 9.5L12.5 7l-3-2.5M12.5 7H5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M9 2.5L4.5 7l4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M5 2.5L9.5 7 5 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.6 2.6l1.1 1.1M10.3 10.3l1.1 1.1M11.4 2.6l-1.1 1.1M3.7 10.3l-1.1 1.1"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconHelp() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5.2 5.3a1.8 1.8 0 013.4.9c0 1.2-1.6 1.5-1.6 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="7" cy="10" r="0.7" fill="currentColor"/>
    </svg>
  );
}

function IconKeyboard() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1" y="3.5" width="12" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="3.5" y1="6.5" x2="3.5" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7" y1="6.5" x2="7" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="10.5" y1="6.5" x2="10.5" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="5" y1="8.5" x2="9" y2="8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconChangelog() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2.5 1.5h6L12 5v7.5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V2a.5.5 0 01.5-.5z"
        stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M8.5 1.5V5H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="4" y1="7.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4" y1="9.8" x2="8" y2="9.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1.5 12.5c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconNetwork2() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="2" cy="2.5" r="1.4" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="12" cy="2.5" r="1.4" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="7" cy="12.5" r="1.4" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="3.1" y1="3.5" x2="5.8" y2="5.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="10.9" y1="3.5" x2="8.2" y2="5.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <line x1="7" y1="9" x2="7" y2="11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}

function IconFlame() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 1.5c0 2.5-3 3-3 5.5a3 3 0 006 0c0-1.5-1-2.5-1-2.5s-.5 1-1.5 1C6.5 5.5 7 3.5 7 1.5z"
        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.5 9.5a1.5 1.5 0 003 0c0-.8-.7-1.5-.7-1.5s-.3.7-1 .7c-.6 0-.3-1-.3-1S5.5 8.7 5.5 9.5z"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconPillars() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="1"   y="10" width="12" height="1.5" rx="0.5" fill="currentColor" opacity="0.7"/>
      <rect x="1"   y="2.5" width="12" height="1.5" rx="0.5" fill="currentColor" opacity="0.7"/>
      <rect x="2"   y="4.2" width="1.8" height="5.6" rx="0.4" fill="currentColor" opacity="0.5"/>
      <rect x="6.1" y="4.2" width="1.8" height="5.6" rx="0.4" fill="currentColor" opacity="0.5"/>
      <rect x="10.2" y="4.2" width="1.8" height="5.6" rx="0.4" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}

function IconBox() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M12 4.5L7 2 2 4.5v5L7 12l5-2.5v-5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M2 4.5l5 2.5 5-2.5M7 7v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconBuilding() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="2" y="2" width="10" height="11" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5 5h1M8 5h1M5 8h1M8 8h1M5 11h1M8 11h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconDatabase() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <ellipse cx="7" cy="4" rx="4.5" ry="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2.5 4v3c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V4" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2.5 7v3c0 1.1 2 2 4.5 2s4.5-.9 4.5-2V7" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserMenu popup
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Modal shell
// ─────────────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div
        className="relative z-10 w-full max-w-lg bg-[#1e1c1a] border border-[#2a2825] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2825]">
          <h2 className="text-[14px] font-semibold text-[#D9C8B4] tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-[#5c5248] hover:text-[#9a9078] transition-colors p-1 rounded-md hover:bg-[#2a2825]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard shortcuts modal
// ─────────────────────────────────────────────────────────────────────────────

const SHORTCUTS = [
  { group: "Navigation",   items: [
    { keys: ["G", "D"],  label: "Go to Dashboard"    },
    { keys: ["G", "A"],  label: "Go to Assets"       },
    { keys: ["G", "V"],  label: "Go to Vendors"      },
    { keys: ["G", "S"],  label: "Go to Data Sets"    },
    { keys: ["G", "U"],  label: "Go to Use Cases"    },
    { keys: ["G", "X"],  label: "Go to Risk"         },
    { keys: ["G", "L"],  label: "Go to Compliance"   },
    { keys: ["G", "G"],  label: "Go to Governance"   },
    { keys: ["G", "C"],  label: "Go to Coverage"     },
    { keys: ["G", "R"],  label: "Go to Reports"      },
  ]},
  { group: "Sidebar",     items: [
    { keys: ["["],       label: "Collapse / expand sidebar" },
  ]},
  { group: "General",     items: [
    { keys: ["?"],       label: "Open keyboard shortcuts"   },
    { keys: ["Esc"],     label: "Close modal / panel"       },
  ]},
];

function Kbd({ k }: { k: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-[10px] font-semibold text-[#9a9078] bg-[#2a2825] border border-[#3a3835] rounded-[4px] font-mono leading-none">
      {k}
    </kbd>
  );
}

function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose}>
      <div className="px-6 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
        {SHORTCUTS.map(({ group, items }) => (
          <div key={group}>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#5c5248] mb-2">{group}</p>
            <div className="space-y-1">
              {items.map(({ keys, label }) => (
                <div key={label} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[#242220] transition-colors">
                  <span className="text-[12.5px] text-[#9a9078]">{label}</span>
                  <div className="flex items-center gap-1">
                    {keys.map((k, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-[10px] text-[#3a3430]">then</span>}
                        <Kbd k={k} />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Get help modal
// ─────────────────────────────────────────────────────────────────────────────

function GetHelpModal({ onClose }: { onClose: () => void }) {
  const helpItems = [
    { icon: "📖", title: "Documentation",    desc: "Guides, API reference, connector setup",   href: "#" },
    { icon: "💬", title: "Community forum",  desc: "Ask questions and share workflows",         href: "#" },
    { icon: "🐛", title: "Report a bug",     desc: "Open a GitHub issue with full context",     href: "#" },
    { icon: "✉️", title: "Contact support",  desc: "Reach our team directly",                  href: "#" },
  ];

  return (
    <Modal title="Get help" onClose={onClose}>
      <div className="px-6 py-4 space-y-2">
        {helpItems.map(({ icon, title, desc, href }) => (
          <a
            key={title}
            href={href}
            onClick={onClose}
            className="flex items-start gap-3.5 p-3.5 rounded-xl border border-[#2a2825] hover:border-[#8A9C8B44] hover:bg-[#1e2420] transition-all group"
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
            <div>
              <p className="text-[13px] font-medium text-[#D9C8B4] group-hover:text-[#c4d4c5] transition-colors">{title}</p>
              <p className="text-[11.5px] text-[#5c5248] mt-0.5">{desc}</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto mt-1 flex-shrink-0 text-[#3a3430] group-hover:text-[#8A9C8B] transition-colors">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        ))}
      </div>
      <div className="px-6 pb-5 pt-1">
        <p className="text-[11px] text-[#3a3430] text-center">Sentinel v0.1.0 — local prototype</p>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Changelog modal
// ─────────────────────────────────────────────────────────────────────────────

const CHANGELOG = [
  {
    version: "0.1.0", date: "June 2026", badge: "Latest",
    changes: [
      "Business productivity AI tool inventory (24 vendors)",
      "Collapsible sidebar with keyboard shortcut",
      "User menu with profile, settings and help",
      "Vendor → Asset → Use Case hierarchy view",
      "Evidence trail on every node",
    ],
  },
  {
    version: "0.0.3", date: "May 2026", badge: null,
    changes: [
      "Warm sage/terracotta/sandstone palette",
      "Node detail page with relationship graph",
      "Confirmation flow for low-confidence nodes",
      "Cross-port authentication fix",
    ],
  },
  {
    version: "0.0.2", date: "May 2026", badge: null,
    changes: [
      "Inventory grouped by node type",
      "Coverage report with compliance gaps",
      "Board-ready PDF export",
      "Rectifications workflow",
    ],
  },
];

function ChangelogModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Changelog" onClose={onClose}>
      <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
        {CHANGELOG.map(({ version, date, badge, changes }) => (
          <div key={version}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[13px] font-bold text-[#D9C8B4]">v{version}</span>
              {badge && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#8A9C8B20] text-[#9baf9c] border border-[#8A9C8B30]">
                  {badge}
                </span>
              )}
              <span className="text-[11px] text-[#3a3430] ml-auto">{date}</span>
            </div>
            <ul className="space-y-1.5">
              {changes.map((c) => (
                <li key={c} className="flex items-start gap-2.5 text-[12.5px] text-[#5c5248]">
                  <span className="mt-[5px] w-1 h-1 rounded-full bg-[#8A9C8B] flex-shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserMenu popup
// ─────────────────────────────────────────────────────────────────────────────

function UserMenu({
  user,
  collapsed,
  onLogout,
  loggingOut,
  modal,
  onOpenModal,
}: {
  user: { email: string; role: string };
  collapsed: boolean;
  onLogout: () => void;
  loggingOut: boolean;
  modal: "shortcuts" | "help" | "changelog" | null;
  onOpenModal: (m: "shortcuts" | "help" | "changelog" | null) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function go(href: string) { setOpen(false); router.push(href); }
  function openModal(m: "shortcuts" | "help" | "changelog") { setOpen(false); onOpenModal(m); }

  const menuItems = [
    { icon: <IconUser />,      label: "Profile",              onClick: () => go("/profile")          },
    { icon: <IconSettings />,  label: "Settings",             onClick: () => go("/settings")         },
    { icon: <IconKeyboard />,  label: "Keyboard shortcuts",   onClick: () => openModal("shortcuts")  },
    { icon: <IconHelp />,      label: "Get help",             onClick: () => openModal("help")       },
    { icon: <IconChangelog />, label: "View changelog",       onClick: () => openModal("changelog")  },
  ];

  return (
    <>
      {/* Modals — rendered here so they sit above the sidebar overlay */}
      {modal === "shortcuts" && <KeyboardShortcutsModal onClose={() => onOpenModal(null)} />}
      {modal === "help"      && <GetHelpModal           onClose={() => onOpenModal(null)} />}
      {modal === "changelog" && <ChangelogModal         onClose={() => onOpenModal(null)} />}

      <div ref={ref} className="relative">
        {/* Trigger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center w-full rounded-lg transition-colors hover:bg-[#2e2c2a] ${collapsed ? "justify-center p-1.5" : "gap-2.5 p-2"}`}
          title={collapsed ? user.email : undefined}
        >
          <div className="w-7 h-7 rounded-full bg-[#1e2420] border border-[#2e3430] flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-black text-[#9baf9c] uppercase leading-none">
              {user.email[0]}
            </span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[11.5px] text-[#9a9078] truncate font-medium leading-tight">{user.email}</p>
                <span className={`inline-block mt-0.5 text-[8.5px] px-1.5 py-px rounded-full border font-bold uppercase tracking-wider leading-none ${ROLE_STYLES[user.role] ?? ROLE_STYLES.VIEWER}`}>
                  {user.role}
                </span>
              </div>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`flex-shrink-0 text-[#3a3430] transition-transform ${open ? "rotate-180" : ""}`}>
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>

        {/* Popup */}
        {open && (
          <div className={`absolute z-50 bottom-full mb-2 bg-[#1e1c1a] border border-[#2a2825] rounded-xl shadow-2xl shadow-black/60 py-1.5 overflow-hidden
            ${collapsed ? "left-full ml-2 w-[220px]" : "left-0 right-0 w-full"}`}
          >
            {/* Header */}
            <div className="px-4 pt-2.5 pb-3 border-b border-[#2a2825]">
              <p className="text-[12px] font-semibold text-[#D9C8B4] truncate">{user.email}</p>
              <span className={`inline-block mt-1 text-[8.5px] px-1.5 py-px rounded-full border font-bold uppercase tracking-wider leading-none ${ROLE_STYLES[user.role] ?? ROLE_STYLES.VIEWER}`}>
                {user.role}
              </span>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {menuItems.map(({ icon, label, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="w-full flex items-center gap-3 px-4 py-[7px] text-[12.5px] text-[#9a9078] hover:text-[#D9C8B4] hover:bg-[#282624] transition-colors text-left"
                >
                  <span className="text-[#5c5248] flex-shrink-0">{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Divider + sign out */}
            <div className="border-t border-[#2a2825] pt-1">
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-4 py-[7px] text-[12.5px] text-[#9a9078] hover:text-[#d4836e] hover:bg-[#2e1e1a] transition-colors text-left disabled:opacity-40"
              >
                <span className="text-[#5c5248] flex-shrink-0"><IconSignOut /></span>
                {loggingOut ? "Signing out…" : "Log out"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation config
// ─────────────────────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Monitor",
    items: [
      { href: "/", label: "Dashboard", Icon: IconGrid },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/assets",    label: "Assets",    Icon: IconBox      },
      { href: "/vendors",   label: "Vendors",   Icon: IconBuilding },
      { href: "/datasets",  label: "Data Sets", Icon: IconDatabase },
      { href: "/use-cases", label: "Use Cases", Icon: IconNetwork2 },
    ],
  },
  {
    label: "Assess",
    items: [
      { href: "/risk",       label: "Risk",       Icon: IconFlame   },
      { href: "/compliance", label: "Compliance", Icon: IconGlobe   },
      { href: "/governance", label: "Governance", Icon: IconPillars },
      { href: "/coverage",   label: "Coverage",   Icon: IconShield  },
    ],
  },
  {
    label: "Export",
    items: [
      { href: "/reports", label: "Board Report", Icon: IconDocument },
    ],
  },
];

// Role badge styles — warm palette
const ROLE_STYLES: Record<string, string> = {
  ADMIN:   "text-[#d4836e] bg-[#C86F5812] border-[#C86F5828]",
  ANALYST: "text-[#aec0af] bg-[#8A9C8B12] border-[#8A9C8B28]",
  VIEWER:  "text-[#9a9078] bg-[#D9C8B408] border-[#D9C8B420]",
};

// ─────────────────────────────────────────────────────────────────────────────
// AppShell
// ─────────────────────────────────────────────────────────────────────────────

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email: string; role: string } | null;
}) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [collapsed, setCollapsed]   = useState(false);
  const [modal, setModal]           = useState<"shortcuts" | "help" | "changelog" | null>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    if (pathname === "/login") return;

    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;

    const GOTO: Record<string, string> = {
      d: "/", a: "/assets", v: "/vendors", s: "/datasets", u: "/use-cases",
      x: "/risk", l: "/compliance", g: "/governance", c: "/coverage", r: "/reports",
    };

    function isTyping(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      return t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable;
    }

    function handler(e: KeyboardEvent) {
      if (isTyping(e)) return;

      // `[` — toggle sidebar
      if (e.key === "[" && !e.metaKey && !e.ctrlKey) {
        setCollapsed((c) => !c);
        return;
      }

      // `?` — open shortcuts modal
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        setModal((m) => m === "shortcuts" ? null : "shortcuts");
        return;
      }

      // `Escape` — close any open modal
      if (e.key === "Escape") {
        setModal(null);
        return;
      }

      // G-chord navigation (G then D/I/U/C/R)
      if (e.key.toLowerCase() === "g" && !e.metaKey && !e.ctrlKey) {
        gPressed = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => { gPressed = false; }, 1500);
        return;
      }

      if (gPressed) {
        const dest = GOTO[e.key.toLowerCase()];
        if (dest) {
          gPressed = false;
          clearTimeout(gTimer);
          router.push(dest);
        }
      }
    }

    document.addEventListener("keydown", handler);
    return () => { document.removeEventListener("keydown", handler); clearTimeout(gTimer); };
  }, [pathname, router]);

  // Login page: standalone — no chrome
  if (pathname === "/login") return <>{children}</>;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  async function handleLogout() {
    setLoggingOut(true);
    try { await logoutUser(); } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const sidebarW = collapsed ? "w-[56px]" : "w-[216px]";
  const mainML   = collapsed ? "ml-[56px]" : "ml-[216px]";

  return (
    <div className="flex min-h-screen bg-[#1a1918]">

      {/* ─────────────────────────── Sidebar ───────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#242220] border-r border-[#2a2825] transition-[width] duration-200 ease-in-out overflow-hidden ${sidebarW}`}
      >
        {/* Logo row */}
        <div className="h-[56px] flex items-center border-b border-[#2a2825] flex-shrink-0 relative px-[15px]">
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0">
              <div className="absolute inset-0 rounded-[6px] bg-[#8A9C8B] opacity-15 group-hover:opacity-25 transition-opacity" />
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="3.5" fill="#8A9C8B"/>
                <circle cx="5" cy="5" r="1.5" fill="#c4d4c5"/>
              </svg>
            </div>
            {!collapsed && (
              <span className="text-[12.5px] font-bold tracking-[0.14em] uppercase text-[#c4b49e] group-hover:text-[#D9C8B4] transition-colors whitespace-nowrap">
                Sentinel
              </span>
            )}
          </Link>

          {/* Collapse toggle — floats to the right edge */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md text-[#3a3430] hover:text-[#9a9078] hover:bg-[#2e2c2a] transition-all ${collapsed ? "right-[50%] translate-x-1/2" : ""}`}
          >
            {collapsed ? <IconChevronRight /> : <IconChevronLeft />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-[7px] space-y-0.5" aria-label="Main navigation">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? "pt-5" : ""}>
              {/* Group label — hidden when collapsed */}
              {!collapsed && (
                <p className="px-2.5 pb-1.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#3a3430] select-none whitespace-nowrap">
                  {group.label}
                </p>
              )}
              {collapsed && gi > 0 && (
                <div className="mx-auto w-4 border-t border-[#2a2825] mb-3" />
              )}
              {group.items.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`
                      flex items-center gap-2.5 py-[7px] rounded-[6px] text-[13px] font-medium transition-all duration-100
                      ${collapsed ? "justify-center px-0" : "px-2.5"}
                      ${active
                        ? "bg-[#1e2420] text-[#c4d4c5]"
                        : "text-[#4a4438] hover:text-[#7a7268] hover:bg-[#282624]"
                      }
                    `}
                  >
                    <span className={`flex-shrink-0 transition-colors ${active ? "text-[#9baf9c]" : "text-[#3a3430]"}`}>
                      <Icon />
                    </span>
                    {!collapsed && <span className="whitespace-nowrap">{label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-[#2a2825] p-2 flex-shrink-0 space-y-1">
          {/* Theme toggle */}
          <ThemeToggle collapsed={collapsed} />
          {user ? (
            <UserMenu
              user={user}
              collapsed={collapsed}
              onLogout={handleLogout}
              loggingOut={loggingOut}
              modal={modal}
              onOpenModal={setModal}
            />
          ) : (
            !collapsed && <p className="text-[11px] text-[#3a3430] px-1">Not signed in</p>
          )}
        </div>
      </aside>

      {/* ─────────────────────────── Main ──────────────────────────────── */}
      <div className={`flex-1 min-h-screen flex flex-col transition-[margin] duration-200 ease-in-out ${mainML}`}>
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
