import type { Metadata } from "next";
import {
  serverGetPortfolioRisk as getPortfolioRisk,
  serverGetUseCases      as getUseCases,
  serverListRectifications as listRectifications,
} from "@/lib/serverApi";
import { PageHeader }    from "@/components/PageHeader";
import { RiskDashboard } from "./RiskDashboard";

export const metadata: Metadata = { title: "Risk" };

export default async function RiskPage() {
  const [portfolioResult, useCasesResult, rectsResult] = await Promise.allSettled([
    getPortfolioRisk(),
    getUseCases(),
    listRectifications({ status: "OPEN" }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assess"
        title="Risk Dashboard"
        subtitle="AI portfolio risk levels, concentration flags, and open actions."
      />
      <RiskDashboard
        portfolio={portfolioResult.status === "fulfilled" ? portfolioResult.value : null}
        useCases={useCasesResult.status  === "fulfilled" ? useCasesResult.value.data : []}
        openRects={rectsResult.status    === "fulfilled" ? rectsResult.value.count : 0}
      />
    </div>
  );
}
