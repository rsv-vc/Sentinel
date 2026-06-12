import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ComplianceDashboard } from "./ComplianceDashboard";

export const metadata: Metadata = { title: "Compliance" };

// Mock use cases
const mockUseCases = Array(12).fill(null).map((_, i) => ({
  id: `uc${i}`,
  label: `Use Case ${i + 1}`,
}));

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assess"
        title="Compliance Dashboard"
        subtitle="AI regulatory obligations by jurisdiction, policy frameworks, and use-case gap analysis."
      />
      <ComplianceDashboard
        useCases={mockUseCases as any}
        jurisdictions={[]}
      />
    </div>
  );
}
