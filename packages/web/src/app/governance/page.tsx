import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { GovernanceDashboard } from "./GovernanceDashboard";
import { SOFTWARE_ASSETS, MOCK_USE_CASES, MOCK_JURISDICTIONS } from "@/lib/mockAssets";

export const metadata: Metadata = { title: "Governance" };

// Enrich use cases with jurisdictions attribute expected by GovernanceDashboard
const mockUseCases = MOCK_USE_CASES.map((uc) => ({
  ...uc,
  attributes: {
    ...uc.attributes,
    jurisdictions: (uc.attributes as any).jurisdictions ?? [],
  },
}));

// Enrich software assets with regions derived from vendor geography
const VENDOR_REGIONS: Record<string, string[]> = {
  "Anthropic":       ["US"],
  "OpenAI":          ["US"],
  "Google Cloud":    ["US", "EU"],
  "AWS":             ["US", "EU", "APAC"],
  "Microsoft":       ["US", "EU"],
  "Notion Labs":     ["US"],
  "Salesforce":      ["US", "EU"],
  "Intercom":        ["US", "EU"],
  "Zendesk":         ["US", "EU"],
  "Grammarly":       ["US"],
  "Jasper":          ["US"],
  "Mistral AI":      ["EU", "US"],
  "Cohere":          ["US", "CA"],
  "Pinecone":        ["US", "EU"],
  "Weaviate":        ["EU", "US"],
  "LangChain":       ["US"],
  "Hugging Face":    ["EU", "US"],
  "Together AI":     ["US"],
  "Databricks":      ["US", "EU"],
  "Snowflake":       ["US", "EU"],
  "Scale AI":        ["US"],
  "Weights & Biases":["US"],
  "ElevenLabs":      ["US"],
  "Deepgram":        ["US"],
  "Glean":           ["US"],
  "Workato":         ["US"],
  "Workday":         ["US", "EU"],
};

const mockAssets = SOFTWARE_ASSETS.map((a) => ({
  ...a,
  attributes: {
    ...a.attributes,
    regions: VENDOR_REGIONS[(a.attributes as any).vendor] ?? ["US"],
  },
}));

export default function GovernancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assess"
        title="Governance Dashboard"
        subtitle="Jurisdictions, data residency, policy frameworks, and regulatory obligations."
      />
      <GovernanceDashboard
        jurisdictions={MOCK_JURISDICTIONS as any}
        assets={mockAssets as any}
        useCases={mockUseCases as any}
      />
    </div>
  );
}
