import type { Metadata } from "next";
import { serverGetUseCases as getUseCases, serverGetNodes as getNodes } from "@/lib/serverApi";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { EmptyState, EmptyIconGraph } from "@/components/EmptyState";
import { UseCasesClient } from "./UseCasesClient";

export const metadata: Metadata = { title: "Use Cases" };

export default async function UseCasesPage() {
  const [ucResult, vendorsResult, assetsResult] = await Promise.allSettled([
    getUseCases(),
    getNodes("VENDOR"),
    getNodes("ASSET"),
  ]);

  const useCases = ucResult.status      === "fulfilled" ? ucResult.value.data      : [];
  const vendors  = vendorsResult.status === "fulfilled" ? vendorsResult.value.data : [];
  const assets   = assetsResult.status  === "fulfilled" ? assetsResult.value.data  : [];

  if (useCases.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="AI Estate" title="Use Cases"
          subtitle="Each use case is composed of assets owned by one or more vendors — click any to explore the full dependency graph" />
        <Card>
          <EmptyState icon={<EmptyIconGraph />} title="No use cases yet"
            body="Run a sync from the Dashboard to infer use cases from connected data sources." />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Estate"
        title="Use Cases"
        subtitle="Each use case is composed of assets owned by one or more vendors — click any to explore the full dependency graph"
      />
      <UseCasesClient useCases={useCases} vendors={vendors} assets={assets} />
    </div>
  );
}
