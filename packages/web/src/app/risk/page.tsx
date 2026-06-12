import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { RiskDashboard } from "./RiskDashboard";

export const metadata: Metadata = { title: "Risk" };

// Mock data
const mockPortfolio = {
  totalUseCases: 12,
  highOrCritical: 2,
  unassessed: 4,
  byLevel: {
    CRITICAL: 0,
    HIGH: 2,
    MEDIUM: 4,
    LOW: 2,
    UN_ASSESSED: 4,
  },
  concentrationFlags: [
    { vendorId: "anthropic", vendorLabel: "Anthropic", useCaseCount: 5, portfolioShare: 42 },
    { vendorId: "openai", vendorLabel: "OpenAI", useCaseCount: 4, portfolioShare: 33 },
  ],
  useCaseSummaries: [
    { id: "1", label: "Knowledge Management", residualLevel: "UN_ASSESSED", jurisdictions: ["US", "EU"], topSignals: ["No vendor nodes detected"], complianceGapCount: 1 },
    { id: "2", label: "Document Creation", residualLevel: "UN_ASSESSED", jurisdictions: ["US"], topSignals: ["Cross-border data egress"], complianceGapCount: 2 },
    { id: "3", label: "Workflow Automation", residualLevel: "UN_ASSESSED", jurisdictions: ["EU"], topSignals: ["No vendor nodes detected"], complianceGapCount: 1 },
    { id: "4", label: "Process Automation", residualLevel: "UN_ASSESSED", jurisdictions: ["US", "EU"], topSignals: ["Overly-broad grants"], complianceGapCount: 1 },
  ],
};

const mockUseCases = Array(12).fill(null).map((_, i) => ({ id: `uc${i}`, label: `Use Case ${i + 1}` }));

export default function RiskPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assess"
        title="Risk Dashboard"
        subtitle="AI portfolio risk levels, concentration flags, and open actions."
      />
      <RiskDashboard
        portfolio={mockPortfolio}
        useCases={mockUseCases}
        openRects={3}
      />
    </div>
  );
}
