import Link from "next/link";

const links = [
  { href: "/",           label: "Dashboard" },
  { href: "/inventory",  label: "Inventory" },
  { href: "/use-cases",  label: "Use Cases" },
  { href: "/changes",    label: "Changes" },
  { href: "/coverage",   label: "Coverage" },
];

export function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-40 h-14 border-b border-[#2a2a38] bg-[#09090f]/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#6366f1] shadow-[0_0_8px_#6366f1]" />
          <span className="text-sm font-semibold tracking-[0.15em] uppercase text-[#e4e4f0]">
            Sentinel
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-sm text-[#8b8ba8] hover:text-[#e4e4f0] hover:bg-[#18181f] rounded-md transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Prototype tag */}
        <span className="text-xs text-[#5b5b70] border border-[#2a2a38] px-2 py-0.5 rounded-full">
          Local prototype
        </span>
      </div>
    </nav>
  );
}
