import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { UseCasesClient } from "./UseCasesClient";
import { ALL_MOCK_ASSETS, ALL_MOCK_VENDORS, MOCK_USE_CASES } from "@/lib/mockAssets";

export const metadata: Metadata = { title: "Use Cases" };

export default function UseCasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Estate"
        title="Use Cases"
        subtitle="Each use case is composed of assets owned by one or more vendors — click any to explore the full dependency graph"
      />
      <UseCasesClient
        useCases={MOCK_USE_CASES as any}
        vendors={ALL_MOCK_VENDORS as any}
        assets={ALL_MOCK_ASSETS as any}
      />
    </div>
  );
}
