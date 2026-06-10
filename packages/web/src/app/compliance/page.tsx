import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { serverGetUseCases, serverGetNodes } from "@/lib/serverApi";
import type { GraphNodeDTO } from "@/lib/api";
import { ComplianceDashboard } from "./ComplianceDashboard";

export const metadata: Metadata = { title: "Compliance" };

export default async function CompliancePage() {
  const [useCasesResult, jurisdictionsResult] = await Promise.all([
    serverGetUseCases(),
    serverGetNodes("JURISDICTION"),
  ]);

  const useCases: GraphNodeDTO[]      = useCasesResult.data ?? [];
  const jurisdictions: GraphNodeDTO[] = jurisdictionsResult.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assess"
        title="Compliance Dashboard"
        subtitle="AI regulatory obligations by jurisdiction, policy frameworks, and use-case gap analysis."
      />
      <ComplianceDashboard
        useCases={useCases}
        jurisdictions={jurisdictions}
      />
    </div>
  );
}
