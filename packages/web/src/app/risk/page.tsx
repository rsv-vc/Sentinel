import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { RiskDashboard } from "./RiskDashboard";
import { MOCK_USE_CASES } from "@/lib/mockAssets";

export const metadata: Metadata = { title: "Risk" };

// Derive risk stats from the shared use-case catalogue
const riskLevels = MOCK_USE_CASES.map((uc) => (uc.attributes as any).riskLevel as string);

const mockPortfolio = {
  totalUseCases: MOCK_USE_CASES.length,
  highOrCritical: riskLevels.filter((l) => l === "HIGH" || l === "CRITICAL").length,
  unassessed:     riskLevels.filter((l) => l === "UN_ASSESSED").length,
  byLevel: {
    CRITICAL:    riskLevels.filter((l) => l === "CRITICAL").length,
    HIGH:        riskLevels.filter((l) => l === "HIGH").length,
    MEDIUM:      riskLevels.filter((l) => l === "MEDIUM").length,
    LOW:         riskLevels.filter((l) => l === "LOW").length,
    UN_ASSESSED: riskLevels.filter((l) => l === "UN_ASSESSED").length,
  },
  concentrationFlags: [
    { vendorId: "anthropic",  vendorLabel: "Anthropic",  useCaseCount: 4, portfolioShare: 50 },
    { vendorId: "openai",     vendorLabel: "OpenAI",     useCaseCount: 4, portfolioShare: 50 },
    { vendorId: "microsoft",  vendorLabel: "Microsoft",  useCaseCount: 4, portfolioShare: 50 },
  ],
  useCaseSummaries: [
    { id: "uc-1", label: "Knowledge Management Assistant", residualLevel: "MEDIUM",      jurisdictions: ["US", "EU"],            topSignals: ["PII data exposure risk", "Cross-border data egress"],                     complianceGapCount: 1 },
    { id: "uc-2", label: "Document Creation Copilot",      residualLevel: "LOW",         jurisdictions: ["US"],                  topSignals: ["Output accuracy review required"],                                         complianceGapCount: 0 },
    { id: "uc-3", label: "Customer Support Triage",        residualLevel: "HIGH",        jurisdictions: ["US", "EU", "APAC"],    topSignals: ["PII processing at scale", "Multi-jurisdiction transfers", "No DPA signed"], complianceGapCount: 3 },
    { id: "uc-4", label: "Code Review Assistant",          residualLevel: "LOW",         jurisdictions: ["US"],                  topSignals: ["Source code exposure risk"],                                               complianceGapCount: 1 },
    { id: "uc-5", label: "Financial Forecasting Model",    residualLevel: "HIGH",        jurisdictions: ["US"],                  topSignals: ["Financial data sensitivity", "SOX compliance gap"],                         complianceGapCount: 2 },
    { id: "uc-6", label: "HR Policy Chatbot",              residualLevel: "MEDIUM",      jurisdictions: ["US", "EU"],            topSignals: ["Employee data privacy (GDPR)", "HR decision automation risk"],              complianceGapCount: 2 },
    { id: "uc-7", label: "Workflow Automation",            residualLevel: "UN_ASSESSED", jurisdictions: ["EU"],                  topSignals: ["No vendor risk assessment", "EU AI Act implications"],                      complianceGapCount: 1 },
    { id: "uc-8", label: "Data Pipeline Intelligence",     residualLevel: "UN_ASSESSED", jurisdictions: ["US"],                  topSignals: ["Data flow mapping incomplete", "Undocumented dependencies"],                 complianceGapCount: 1 },
  ],
};

export default function RiskPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assess"
        title="Risk Dashboard"
        subtitle="AI portfolio risk levels, concentration flags, and open actions."
      />
      <RiskDashboard
        portfolio={mockPortfolio as any}
        useCases={MOCK_USE_CASES as any}
        openRects={3}
      />
    </div>
  );
}
