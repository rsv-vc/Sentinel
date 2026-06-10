import type { Metadata } from "next";
import { serverGetNodes as getNodes } from "@/lib/serverApi";
import { PageHeader } from "@/components/PageHeader";
import { AssetsClient } from "./AssetsClient";

export const metadata: Metadata = { title: "Assets" };

export default async function AssetsPage() {
  const assetsResult = await getNodes("ASSET");
  const allAssets    = assetsResult.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Assets"
        subtitle="All AI software tools and hardware compute across your estate."
      />
      <AssetsClient assets={allAssets} />
    </div>
  );
}
