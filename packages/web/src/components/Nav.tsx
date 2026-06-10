import Link from "next/link";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { UserChip } from "./UserChip";

const links = [
  { href: "/",                label: "Dashboard"    },
  { href: "/inventory",       label: "Inventory"    },
  { href: "/use-cases",       label: "Use Cases"    },
  { href: "/changes",         label: "Changes"      },
  { href: "/coverage",        label: "Coverage"     },
  { href: "/reports",         label: "Report"       },
  { href: "/rectifications",  label: "Rectify"      },
];

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "sentinel-dev-secret-change-in-production",
);

async function getCurrentUser(): Promise<{ email: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sentinel_token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { email: payload.email as string, role: payload.role as string };
  } catch {
    return null;
  }
}

export async function Nav() {
  const user = await getCurrentUser();

  return (
    <nav className="fixed top-0 inset-x-0 z-40 h-14 border-b border-[#2a2825] bg-[#1a1918]/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">

        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8A9C8B] shadow-[0_0_8px_#8A9C8B]" />
          <span className="text-sm font-semibold tracking-[0.15em] uppercase text-[#D9C8B4]">
            Sentinel
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-sm text-[#9a9078] hover:text-[#D9C8B4] hover:bg-[#242220] rounded-md transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side: user + logout OR prototype tag */}
        <div className="flex items-center gap-3">
          {user ? (
            <UserChip email={user.email} role={user.role} />
          ) : (
            <span className="text-xs text-[#5c5248] border border-[#2a2825] px-2 py-0.5 rounded-full">
              Local prototype
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
