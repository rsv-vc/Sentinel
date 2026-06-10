import type { Metadata } from "next";
import { serverGetNodes as getNodes } from "@/lib/serverApi";
import { PageHeader } from "@/components/PageHeader";
import { DatasetsClient } from "./DatasetsClient";

export const metadata: Metadata = { title: "Data Sets" };

export default async function DatasetsPage() {
  const result = await getNodes("DATA_ASSET");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Data Sets"
        subtitle="Data assets that flow through your AI estate."
      />
      <DatasetsClient datasets={result.data ?? []} />
    </div>
  );
}
