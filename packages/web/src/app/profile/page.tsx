import type { Metadata } from "next";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { Card, CardTitle } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Profile" };

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "sentinel-dev-secret-change-in-production",
);

const ROLE_STYLES: Record<string, string> = {
  ADMIN:   "text-[#d4836e] bg-[#C86F5812] border-[#C86F5828]",
  ANALYST: "text-[#aec0af] bg-[#8A9C8B12] border-[#8A9C8B28]",
  VIEWER:  "text-[#9a9078] bg-[#D9C8B408] border-[#D9C8B420]",
};

const ROLE_DESC: Record<string, string> = {
  ADMIN:   "Full read/write access — can sync connectors, confirm nodes, and manage rectifications.",
  ANALYST: "Read and annotate — can confirm nodes and create rectifications, cannot sync.",
  VIEWER:  "Read-only — can explore the graph and view reports.",
};

export default async function ProfilePage() {
  const store = await cookies();
  const token = store.get("sentinel_token")?.value;
  if (!token) redirect("/login");

  const { payload } = await jwtVerify(token, JWT_SECRET);
  const email = payload.email as string;
  const role  = payload.role  as string;
  const name  = payload.name  as string | undefined;

  const initial = (name ?? email)[0].toUpperCase();

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader eyebrow="Account" title="Profile" subtitle="Your identity and access level within this Sentinel instance." />

      {/* Avatar + identity */}
      <Card>
        <div className="flex items-center gap-5 py-2">
          <div className="w-14 h-14 rounded-full bg-[#1e2420] border-2 border-[#2e3430] flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-black text-[#9baf9c] uppercase leading-none">{initial}</span>
          </div>
          <div>
            {name && <p className="text-[16px] font-semibold text-[#D9C8B4]">{name}</p>}
            <p className="text-[13px] text-[#9a9078] mt-0.5">{email}</p>
            <span className={`inline-block mt-1.5 text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider leading-none ${ROLE_STYLES[role] ?? ROLE_STYLES.VIEWER}`}>
              {role}
            </span>
          </div>
        </div>
      </Card>

      {/* Role details */}
      <Card>
        <CardTitle>Access Level</CardTitle>
        <div className="mt-3 space-y-3">
          {Object.entries(ROLE_DESC).map(([r, desc]) => (
            <div
              key={r}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                r === role
                  ? "border-[#8A9C8B44] bg-[#1e2420]"
                  : "border-[#2a2825] opacity-40"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full mt-[5px] flex-shrink-0 ${r === role ? "bg-[#9baf9c]" : "bg-[#3a3430]"}`} />
              <div>
                <p className={`text-[12px] font-bold uppercase tracking-wider ${ROLE_STYLES[r]?.split(" ")[0] ?? "text-[#9a9078]"}`}>{r}</p>
                <p className="text-[12px] text-[#5c5248] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Session info */}
      <Card>
        <CardTitle>Session</CardTitle>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 mt-3">
          <div>
            <dt className="text-[10px] text-[#5c5248] uppercase tracking-wide">Auth method</dt>
            <dd className="text-[13px] text-[#D9C8B4] mt-0.5">JWT cookie</dd>
          </div>
          <div>
            <dt className="text-[10px] text-[#5c5248] uppercase tracking-wide">Session duration</dt>
            <dd className="text-[13px] text-[#D9C8B4] mt-0.5">8 hours</dd>
          </div>
          <div>
            <dt className="text-[10px] text-[#5c5248] uppercase tracking-wide">Instance</dt>
            <dd className="text-[13px] text-[#D9C8B4] mt-0.5 font-mono">sentinel.local</dd>
          </div>
          <div>
            <dt className="text-[10px] text-[#5c5248] uppercase tracking-wide">Environment</dt>
            <dd className="text-[13px] text-[#D9C8B4] mt-0.5">Local prototype</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
