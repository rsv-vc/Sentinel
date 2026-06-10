import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in — Sentinel" };

const DEMO_USERS = [
  { role: "ADMIN",   email: "admin@sentinel.local",   password: "sentinel-admin-2024"   },
  { role: "ANALYST", email: "analyst@sentinel.local", password: "sentinel-analyst-2024" },
  { role: "VIEWER",  email: "viewer@sentinel.local",  password: "sentinel-viewer-2024"  },
] as const;

const ROLE_STYLE: Record<string, string> = {
  ADMIN:   "text-[#d4836e] bg-[#C86F5810] border-[#C86F5828]",
  ANALYST: "text-[#aec0af] bg-[#8A9C8B10] border-[#8A9C8B28]",
  VIEWER:  "text-[#9a9078] bg-[#D9C8B408] border-[#D9C8B420]",
};

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "radial-gradient(ellipse 90% 60% at 50% 15%, #1e2420 0%, #1a1918 60%)" }}
    >
      {/* Subtle dot-grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #8A9C8B18 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 20%, black 0%, transparent 100%)",
        }}
      />

      <div className="relative w-full max-w-[380px] space-y-4">

        {/* ── Wordmark ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[12px] bg-[#8A9C8B15] border border-[#8A9C8B30] mb-4">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8" fill="#8A9C8B" opacity="0.85"/>
              <circle cx="11" cy="11" r="4" fill="#c4d4c5"/>
              <circle cx="11" cy="11" r="1.5" fill="#1a1918"/>
            </svg>
          </div>
          <h1 className="text-[14px] font-bold tracking-[0.18em] uppercase text-[#c4b49e] mb-1">
            Sentinel
          </h1>
          <p className="text-[12px] text-[#4a4438]">AI Risk System of Record</p>
        </div>

        {/* ── Sign-in card ── */}
        <div className="bg-[#242220] border border-[#2a2825] rounded-2xl p-7 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          <div className="mb-6">
            <h2 className="text-[18px] font-bold text-[#D9C8B4] mb-1">Sign in</h2>
            <p className="text-[12.5px] text-[#4a4438]">Use a demo account below to explore.</p>
          </div>
          <LoginForm />
        </div>

        {/* ── Demo credentials ── */}
        <div className="bg-[#1e1c1a] border border-[#2a2825] rounded-xl p-4">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#3a3430] mb-3">
            Demo accounts
          </p>
          <div className="space-y-2.5">
            {DEMO_USERS.map((u) => (
              <div key={u.role} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-1.5 py-[2px] rounded-full border uppercase tracking-widest flex-shrink-0 ${ROLE_STYLE[u.role]}`}>
                    {u.role}
                  </span>
                  <span className="text-[11.5px] text-[#4a4438] font-mono truncate">{u.email}</span>
                </div>
                <p className="text-[10.5px] text-[#3a3430] font-mono pl-0.5">
                  pw: <span className="text-[#5c5248] select-all">{u.password}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#2e2b27] mt-3 pt-3 border-t border-[#232120]">
            Run <code className="text-[#5c5248] font-mono">npm run db:seed</code> to create these accounts
          </p>
        </div>

        <p className="text-[11px] text-[#2a2825] text-center">
          Local prototype · Not for production use
        </p>
      </div>
    </div>
  );
}
