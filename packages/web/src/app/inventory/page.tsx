import type { Metadata } from "next";
import { serverGetNodes as getNodes } from "@/lib/serverApi";
import { PageHeader } from "@/components/PageHeader";
import { InventoryClient } from "./InventoryClient";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  // Fetch everything in parallel — client will handle all filtering
  const [assetsResult, , vendorsResult, useCasesResult, dataResult, jurisdictionsResult] =
    await Promise.all([
      getNodes("ASSET"),
      getNodes("USE_CASE"),
      getNodes("VENDOR"),
      getNodes("USE_CASE"),
      getNodes("DATA_ASSET"),
      getNodes("JURISDICTION"),
    ]);

  // Combine assets + models (both come back as ASSET type, distinguished by kind attribute)
  const allAssets = assetsResult.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Estate"
        title="Inventory"
        subtitle="All AI tools, hardware, use cases, and data assets across your estate."
      />
      <InventoryClient
        assets={allAssets}
        useCases={useCasesResult.data ?? []}
        vendors={vendorsResult.data ?? []}
        dataAssets={dataResult.data ?? []}
        jurisdictions={jurisdictionsResult.data ?? []}
      />
    </div>
  );
}
