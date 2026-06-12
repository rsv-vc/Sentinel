import { CostsDashboard } from "./CostsDashboard";
import { PageHeader } from "@/components/PageHeader";

export const metadata = {
  title: "Costs — Sentinel",
};

export default function CostsPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Assess"
        title="Cost Optimization Dashboard"
        subtitle="Track AI spend, identify savings opportunities, and optimize your cost-to-value ratio."
      />
      <CostsDashboard />
    </main>
  );
}
