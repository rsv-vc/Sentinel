import type { Metadata } from "next";
import { serverGetNodes as getNodes } from "@/lib/serverApi";
import { PageHeader } from "@/components/PageHeader";
import { VendorsClient } from "./VendorsClient";

export const metadata: Metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const [vendorsResult, assetsResult] = await Promise.all([
    getNodes("VENDOR"),
    getNodes("ASSET"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Vendors"
        subtitle="All AI vendors and their tools across your estate."
      />
      <VendorsClient
        vendors={vendorsResult.data ?? []}
        assets={assetsResult.data ?? []}
      />
    </div>
  );
}
