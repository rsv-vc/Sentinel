import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { UseCasesClient } from "./UseCasesClient";
import { ALL_MOCK_ASSETS, ALL_MOCK_VENDORS } from "@/lib/mockAssets";

export const metadata: Metadata = { title: "Use Cases" };

const mockUseCases = [
  { id: "uc-1", label: "Knowledge Management Assistant", nodeType: "USE_CASE", confidence: "MEDIUM", attributes: { riskLevel: "MEDIUM", jurisdictions: ["US", "EU"], description: "Internal Q&A chatbot over company docs", vendorIds: ["v-anthropic"] } },
  { id: "uc-2", label: "Document Creation Copilot", nodeType: "USE_CASE", confidence: "HIGH", attributes: { riskLevel: "LOW", jurisdictions: ["US"], description: "AI-assisted drafting for proposals and reports", vendorIds: ["v-openai"] } },
  { id: "uc-3", label: "Customer Support Triage", nodeType: "USE_CASE", confidence: "HIGH", attributes: { riskLevel: "HIGH", jurisdictions: ["US", "EU", "APAC"], description: "Automated ticket classification and routing", vendorIds: ["v-openai", "v-anthropic"] } },
  { id: "uc-4", label: "Code Review Assistant", nodeType: "USE_CASE", confidence: "HIGH", attributes: { riskLevel: "LOW", jurisdictions: ["US"], description: "Automated PR review suggestions", vendorIds: ["v-anthropic"] } },
  { id: "uc-5", label: "Financial Forecasting Model", nodeType: "USE_CASE", confidence: "HIGH", attributes: { riskLevel: "HIGH", jurisdictions: ["US"], description: "ML pipeline for revenue projections", vendorIds: ["v-aws", "v-google"] } },
  { id: "uc-6", label: "HR Policy Chatbot", nodeType: "USE_CASE", confidence: "MEDIUM", attributes: { riskLevel: "MEDIUM", jurisdictions: ["US", "EU"], description: "Employee self-service for HR queries", vendorIds: ["v-openai"] } },
  { id: "uc-7", label: "Workflow Automation", nodeType: "USE_CASE", confidence: "LOW", attributes: { riskLevel: "UN_ASSESSED", jurisdictions: ["EU"], description: "Process orchestration across internal tools", vendorIds: ["v-anthropic"] } },
  { id: "uc-8", label: "Data Pipeline Intelligence", nodeType: "USE_CASE", confidence: "LOW", attributes: { riskLevel: "UN_ASSESSED", jurisdictions: ["US"], description: "Anomaly detection in data ingestion pipelines", vendorIds: ["v-aws"] } },
];

export default function UseCasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Estate"
        title="Use Cases"
        subtitle="Each use case is composed of assets owned by one or more vendors — click any to explore the full dependency graph"
      />
      <UseCasesClient
        useCases={mockUseCases as any}
        vendors={ALL_MOCK_VENDORS as any}
        assets={ALL_MOCK_ASSETS as any}
      />
    </div>
  );
}
