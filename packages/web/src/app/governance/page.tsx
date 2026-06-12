import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { GovernanceDashboard } from "./GovernanceDashboard";

export const metadata: Metadata = { title: "Governance" };

// Mock data
const mockJurisdictions = Array(10).fill(null).map((_, i) => ({ id: `j${i}`, label: `Jurisdiction ${i}` }));
const mockAssets = Array(12).fill(null).map((_, i) => ({ id: `a${i}`, label: `Asset ${i}`, attributes: { regions: ["US", "EU"] } }));
const mockUseCases = Array(12).fill(null).map((_, i) => ({ id: `uc${i}`, label: `Use Case ${i}`, attributes: { jurisdictions: ["US", "EU"] } }));

export default function GovernancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assess"
        title="Governance Dashboard"
        subtitle="Jurisdictions, data residency, policy frameworks, and regulatory obligations."
      />
      <GovernanceDashboard
        jurisdictions={mockJurisdictions}
        assets={mockAssets}
        useCases={mockUseCases}
      />
    </div>
  );
}
