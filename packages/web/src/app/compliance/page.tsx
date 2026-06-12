import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { ComplianceDashboard } from "./ComplianceDashboard";
import { MOCK_USE_CASES, MOCK_JURISDICTIONS } from "@/lib/mockAssets";

export const metadata: Metadata = { title: "Compliance" };

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assess"
        title="Compliance Dashboard"
        subtitle="AI regulatory obligations by jurisdiction, policy frameworks, and use-case gap analysis."
      />
      <ComplianceDashboard
        useCases={MOCK_USE_CASES as any}
        jurisdictions={MOCK_JURISDICTIONS as any}
      />
    </div>
  );
}
