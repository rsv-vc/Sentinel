import type { Metadata } from "next";
import {
  serverGetNodes as getNodes,
  serverGetUseCases as getUseCases,
} from "@/lib/serverApi";
import { PageHeader }         from "@/components/PageHeader";
import { GovernanceDashboard } from "./GovernanceDashboard";

export const metadata: Metadata = { title: "Governance" };

export default async function GovernancePage() {
  const [jurisdictionsResult, assetsResult, useCasesResult] = await Promise.allSettled([
    getNodes("JURISDICTION"),
    getNodes("ASSET"),
    getUseCases(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assess"
        title="Governance Dashboard"
        subtitle="Jurisdictions, data residency, policy frameworks, and regulatory obligations."
      />
      <GovernanceDashboard
        jurisdictions={jurisdictionsResult.status === "fulfilled" ? jurisdictionsResult.value.data : []}
        assets={assetsResult.status             === "fulfilled" ? assetsResult.value.data          : []}
        useCases={useCasesResult.status         === "fulfilled" ? useCasesResult.value.data         : []}
      />
    </div>
  );
}
