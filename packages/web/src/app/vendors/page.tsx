import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { VendorsClient } from "./VendorsClient";

export const metadata: Metadata = { title: "Vendors" };

const mockVendors = [
  { id: "v-anthropic", label: "Anthropic", nodeType: "VENDOR", attributes: { website: "anthropic.com", category: "LLM Provider", tier: "CRITICAL" } },
  { id: "v-openai", label: "OpenAI", nodeType: "VENDOR", attributes: { website: "openai.com", category: "LLM Provider", tier: "CRITICAL" } },
  { id: "v-aws", label: "Amazon Web Services", nodeType: "VENDOR", attributes: { website: "aws.amazon.com", category: "Cloud Infrastructure", tier: "HIGH" } },
  { id: "v-google", label: "Google Cloud", nodeType: "VENDOR", attributes: { website: "cloud.google.com", category: "Cloud Infrastructure", tier: "HIGH" } },
  { id: "v-huggingface", label: "Hugging Face", nodeType: "VENDOR", attributes: { website: "huggingface.co", category: "ML Platform", tier: "MEDIUM" } },
];

const mockAssets = [
  { id: "a-claude", label: "Claude API", nodeType: "ASSET", attributes: { vendorId: "v-anthropic", kind: "SOFTWARE", monthlyCostUsd: 2500 } },
  { id: "a-gpt4", label: "GPT-4 API", nodeType: "ASSET", attributes: { vendorId: "v-openai", kind: "SOFTWARE", monthlyCostUsd: 3200 } },
  { id: "a-gpt35", label: "GPT-3.5 Turbo", nodeType: "ASSET", attributes: { vendorId: "v-openai", kind: "SOFTWARE", monthlyCostUsd: 800 } },
  { id: "a-bedrock", label: "AWS Bedrock", nodeType: "ASSET", attributes: { vendorId: "v-aws", kind: "SOFTWARE", monthlyCostUsd: 1400 } },
  { id: "a-gpu", label: "GPU Cluster (p3.16xlarge)", nodeType: "ASSET", attributes: { vendorId: "v-aws", kind: "HARDWARE", monthlyCostUsd: 8500 } },
  { id: "a-vertex", label: "Vertex AI", nodeType: "ASSET", attributes: { vendorId: "v-google", kind: "SOFTWARE", monthlyCostUsd: 1200 } },
  { id: "a-hf-inference", label: "HF Inference API", nodeType: "ASSET", attributes: { vendorId: "v-huggingface", kind: "SOFTWARE", monthlyCostUsd: 400 } },
];

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Vendors"
        subtitle="All AI vendors and their tools across your estate."
      />
      <VendorsClient vendors={mockVendors as any} assets={mockAssets as any} />
    </div>
  );
}
