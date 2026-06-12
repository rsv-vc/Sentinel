import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import "./globals.css";
import { AppShell }      from "@/components/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Sentinel", template: "%s — Sentinel" },
  description: "Independent, continuous AI risk system of record for regulated enterprises.",
};

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "sentinel-dev-secret-change-in-production",
);

const DEMO_USER = { email: "demo@thevcventure.com", role: "ADMIN" };

async function getCurrentUser(): Promise<{ email: string; role: string }> {
  try {
    const store = await cookies();
    const token = store.get("sentinel_token")?.value;
    if (!token) return DEMO_USER;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { email: payload.email as string, role: payload.role as string };
  } catch {
    return DEMO_USER;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    // suppressHydrationWarning prevents theme-class mismatch between SSR and client
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-[#1a1918] text-[#D9C8B4] antialiased">
        <ThemeProvider>
          <AppShell user={user}>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
