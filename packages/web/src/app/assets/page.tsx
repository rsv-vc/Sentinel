import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { AssetsClient } from "./AssetsClient";

export const metadata: Metadata = { title: "Assets" };

const mockAssets = [
  { id: "a-claude", label: "Claude API", nodeType: "ASSET", attributes: { vendorId: "v-anthropic", vendorLabel: "Anthropic", kind: "SOFTWARE", monthlyCostUsd: 2500, utilizationPercent: 85, regions: ["US-EAST"] } },
  { id: "a-gpt4", label: "GPT-4 API", nodeType: "ASSET", attributes: { vendorId: "v-openai", vendorLabel: "OpenAI", kind: "SOFTWARE", monthlyCostUsd: 3200, utilizationPercent: 72, regions: ["US-EAST"] } },
  { id: "a-gpt35", label: "GPT-3.5 Turbo", nodeType: "ASSET", attributes: { vendorId: "v-openai", vendorLabel: "OpenAI", kind: "SOFTWARE", monthlyCostUsd: 800, utilizationPercent: 60, regions: ["US-EAST"] } },
  { id: "a-bedrock", label: "AWS Bedrock", nodeType: "ASSET", attributes: { vendorId: "v-aws", vendorLabel: "AWS", kind: "SOFTWARE", monthlyCostUsd: 1400, utilizationPercent: 55, regions: ["US-EAST", "EU-WEST"] } },
  { id: "a-gpu", label: "GPU Cluster (p3.16xlarge)", nodeType: "ASSET", attributes: { vendorId: "v-aws", vendorLabel: "AWS", kind: "HARDWARE", monthlyCostUsd: 8500, utilizationPercent: 45, regions: ["US-EAST"] } },
  { id: "a-vertex", label: "Vertex AI", nodeType: "ASSET", attributes: { vendorId: "v-google", vendorLabel: "Google Cloud", kind: "SOFTWARE", monthlyCostUsd: 1200, utilizationPercent: 68, regions: ["EU-WEST"] } },
  { id: "a-hf-inference", label: "HF Inference API", nodeType: "ASSET", attributes: { vendorId: "v-huggingface", vendorLabel: "Hugging Face", kind: "SOFTWARE", monthlyCostUsd: 400, utilizationPercent: 30, regions: ["US-EAST"] } },
  { id: "a-langchain", label: "LangChain Cloud", nodeType: "ASSET", attributes: { vendorId: "v-langchain", vendorLabel: "LangChain", kind: "SOFTWARE", monthlyCostUsd: 200, utilizationPercent: 90, regions: ["US-EAST"] } },
  { id: "a-pinecone", label: "Pinecone Vector DB", nodeType: "ASSET", attributes: { vendorId: "v-pinecone", vendorLabel: "Pinecone", kind: "SOFTWARE", monthlyCostUsd: 500, utilizationPercent: 78, regions: ["US-EAST", "EU-WEST"] } },
];

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Assets"
        subtitle="All AI software tools and hardware compute across your estate."
      />
      <AssetsClient assets={mockAssets as any} />
    </div>
  );
}
