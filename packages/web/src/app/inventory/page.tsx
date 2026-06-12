import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { InventoryClient } from "./InventoryClient";

export const metadata: Metadata = { title: "Inventory" };

const mockAssets = [
  { id: "a-claude", label: "Claude API", nodeType: "ASSET", attributes: { vendorId: "v-anthropic", kind: "SOFTWARE", monthlyCostUsd: 2500 } },
  { id: "a-gpt4", label: "GPT-4 API", nodeType: "ASSET", attributes: { vendorId: "v-openai", kind: "SOFTWARE", monthlyCostUsd: 3200 } },
  { id: "a-gpt35", label: "GPT-3.5 Turbo", nodeType: "ASSET", attributes: { vendorId: "v-openai", kind: "SOFTWARE", monthlyCostUsd: 800 } },
  { id: "a-bedrock", label: "AWS Bedrock", nodeType: "ASSET", attributes: { vendorId: "v-aws", kind: "SOFTWARE", monthlyCostUsd: 1400 } },
  { id: "a-gpu", label: "GPU Cluster", nodeType: "ASSET", attributes: { vendorId: "v-aws", kind: "HARDWARE", monthlyCostUsd: 8500 } },
  { id: "a-vertex", label: "Vertex AI", nodeType: "ASSET", attributes: { vendorId: "v-google", kind: "SOFTWARE", monthlyCostUsd: 1200 } },
];

const mockUseCases = [
  { id: "uc-1", label: "Knowledge Management Assistant", nodeType: "USE_CASE", attributes: { riskLevel: "MEDIUM" } },
  { id: "uc-2", label: "Document Creation Copilot", nodeType: "USE_CASE", attributes: { riskLevel: "LOW" } },
  { id: "uc-3", label: "Customer Support Triage", nodeType: "USE_CASE", attributes: { riskLevel: "HIGH" } },
  { id: "uc-4", label: "Code Review Assistant", nodeType: "USE_CASE", attributes: { riskLevel: "LOW" } },
  { id: "uc-5", label: "Financial Forecasting Model", nodeType: "USE_CASE", attributes: { riskLevel: "HIGH" } },
];

const mockVendors = [
  { id: "v-anthropic", label: "Anthropic", nodeType: "VENDOR", attributes: {} },
  { id: "v-openai", label: "OpenAI", nodeType: "VENDOR", attributes: {} },
  { id: "v-aws", label: "AWS", nodeType: "VENDOR", attributes: {} },
  { id: "v-google", label: "Google Cloud", nodeType: "VENDOR", attributes: {} },
];

const mockDataAssets = [
  { id: "ds-1", label: "Customer Profiles DB", nodeType: "DATA_ASSET", attributes: { sensitivity: "HIGH", containsPii: true } },
  { id: "ds-2", label: "Product Catalog", nodeType: "DATA_ASSET", attributes: { sensitivity: "LOW", containsPii: false } },
  { id: "ds-3", label: "Support Ticket Archive", nodeType: "DATA_ASSET", attributes: { sensitivity: "MEDIUM", containsPii: true } },
];

const mockJurisdictions = [
  { id: "j-us", label: "United States", nodeType: "JURISDICTION", attributes: { code: "US" } },
  { id: "j-eu", label: "European Union", nodeType: "JURISDICTION", attributes: { code: "EU" } },
  { id: "j-uk", label: "United Kingdom", nodeType: "JURISDICTION", attributes: { code: "UK" } },
  { id: "j-apac", label: "APAC", nodeType: "JURISDICTION", attributes: { code: "APAC" } },
];

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Estate"
        title="Inventory"
        subtitle="All AI tools, hardware, use cases, and data assets across your estate."
      />
      <InventoryClient
        assets={mockAssets as any}
        useCases={mockUseCases as any}
        vendors={mockVendors as any}
        dataAssets={mockDataAssets as any}
        jurisdictions={mockJurisdictions as any}
      />
    </div>
  );
}
