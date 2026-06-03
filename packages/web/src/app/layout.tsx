import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sentinel — AI Risk System of Record",
  description: "Continuous, independent AI risk monitoring for regulated enterprises.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#09090f", color: "#e4e4f0", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
