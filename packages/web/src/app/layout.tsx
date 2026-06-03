import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: { default: "Sentinel", template: "%s — Sentinel" },
  description: "Independent, continuous AI risk system of record for regulated enterprises.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#09090f] text-[#e4e4f0]">
        <Nav />
        <main className="max-w-7xl mx-auto px-6 pt-20 pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
