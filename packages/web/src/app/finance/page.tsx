import { FinanceDashboard } from "./FinanceDashboard";
import { PageHeader } from "@/components/PageHeader";

export const metadata = {
  title: "Finance — Sentinel",
};

export default function FinancePage() {
  return (
    <main className="space-y-6">
      <PageHeader
        eyebrow="Assess"
        title="Finance Dashboard"
        subtitle="Track AI spend, identify savings opportunities, and optimize your cost-to-value ratio."
      />
      <FinanceDashboard />
    </main>
  );
}
