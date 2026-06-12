import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { UseCasesClient } from "./UseCasesClient";

export const metadata: Metadata = { title: "Use Cases" };

const mockUseCases = [
  { id: "uc-1", label: "Knowledge Management Assistant", nodeType: "USE_CASE", attributes: { riskLevel: "MEDIUM", jurisdictions: ["US", "EU"], description: "Internal Q&A chatbot over company docs", vendorIds: ["v-anthropic"] } },
  { id: "uc-2", label: "Document Creation Copilot", nodeType: "USE_CASE", attributes: { riskLevel: "LOW", jurisdictions: ["US"], description: "AI-assisted drafting for proposals and reports", vendorIds: ["v-openai"] } },
  { id: "uc-3", label: "Customer Support Triage", nodeType: "USE_CASE", attributes: { riskLevel: "HIGH", jurisdictions: ["US", "EU", "APAC"], description: "Automated ticket classification and routing", vendorIds: ["v-openai", "v-anthropic"] } },
  { id: "uc-4", label: "Code Review Assistant", nodeType: "USE_CASE", attributes: { riskLevel: "LOW", jurisdictions: ["US"], description: "Automated PR review suggestions", vendorIds: ["v-anthropic"] } },
  { id: "uc-5", label: "Financial Forecasting Model", nodeType: "USE_CASE", attributes: { riskLevel: "HIGH", jurisdictions: ["US"], description: "ML pipeline for revenue projections", vendorIds: ["v-aws", "v-google"] } },
  { id: "uc-6", label: "HR Policy Chatbot", nodeType: "USE_CASE", attributes: { riskLevel: "MEDIUM", jurisdictions: ["US", "EU"], description: "Employee self-service for HR queries", vendorIds: ["v-openai"] } },
  { id: "uc-7", label: "Workflow Automation", nodeType: "USE_CASE", attributes: { riskLevel: "UN_ASSESSED", jurisdictions: ["EU"], description: "Process orchestration across internal tools", vendorIds: ["v-anthropic"] } },
  { id: "uc-8", label: "Data Pipeline Intelligence", nodeType: "USE_CASE", attributes: { riskLevel: "UN_ASSESSED", jurisdictions: ["US"], description: "Anomaly detection in data ingestion pipelines", vendorIds: ["v-aws"] } },
];

const mockVendors = [
  { id: "v-anthropic", label: "Anthropic", nodeType: "VENDOR", attributes: {} },
  { id: "v-openai", label: "OpenAI", nodeType: "VENDOR", attributes: {} },
  { id: "v-aws", label: "AWS", nodeType: "VENDOR", attributes: {} },
  { id: "v-google", label: "Google Cloud", nodeType: "VENDOR", attributes: {} },
];

const mockAssets = [
  { id: "a-claude", label: "Claude API", nodeType: "ASSET", attributes: { vendorId: "v-anthropic" } },
  { id: "a-gpt4", label: "GPT-4 API", nodeType: "ASSET", attributes: { vendorId: "v-openai" } },
  { id: "a-bedrock", label: "AWS Bedrock", nodeType: "ASSET", attributes: { vendorId: "v-aws" } },
];

export default function UseCasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Estate"
        title="Use Cases"
        subtitle="Each use case is composed of assets owned by one or more vendors — click any to explore the full dependency graph"
      />
      <UseCasesClient useCases={mockUseCases as any} vendors={mockVendors as any} assets={mockAssets as any} />
    </div>
  );
}
