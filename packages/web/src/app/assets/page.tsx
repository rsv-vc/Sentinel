import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { AssetsClient } from "./AssetsClient";
import { ALL_MOCK_ASSETS } from "@/lib/mockAssets";

export const metadata: Metadata = { title: "Assets" };

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Assets"
        subtitle="All AI software tools and hardware compute across your estate."
      />
      <AssetsClient assets={ALL_MOCK_ASSETS as any} />
    </div>
  );
}
