import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { AssetsClient } from "./AssetsClient";

export const metadata: Metadata = { title: "Assets" };

const mockAssets = [
  {
    id: "a-claude", label: "Claude API", nodeType: "ASSET",
    attributes: {
      vendorId: "v-anthropic", vendor: "Anthropic", kind: "MODEL_DEPLOYMENT",
      monthlyCostUsd: 2500, utilizationPercent: 85, regions: ["US-EAST"],
      useCaseLabels: ["Knowledge Management", "Code Review"],
      tags: { pricing: "subscription", planName: "API Pro", pricePerSeat: "50", seats: 50 },
    },
  },
  {
    id: "a-gpt4", label: "GPT-4 API", nodeType: "ASSET",
    attributes: {
      vendorId: "v-openai", vendor: "OpenAI", kind: "MODEL_DEPLOYMENT",
      monthlyCostUsd: 3200, utilizationPercent: 72, regions: ["US-EAST"],
      useCaseLabels: ["Document Creation", "Customer Support"],
      tags: { pricing: "paid", planName: "Enterprise", pricePerSeat: "20", seats: 160 },
    },
  },
  {
    id: "a-gpt35", label: "GPT-3.5 Turbo", nodeType: "ASSET",
    attributes: {
      vendorId: "v-openai", vendor: "OpenAI", kind: "MODEL_DEPLOYMENT",
      monthlyCostUsd: 800, utilizationPercent: 60, regions: ["US-EAST"],
      useCaseLabels: ["Customer Support", "HR Automation"],
      tags: { pricing: "paid", planName: "Standard" },
    },
  },
  {
    id: "a-bedrock", label: "AWS Bedrock", nodeType: "ASSET",
    attributes: {
      vendorId: "v-aws", vendor: "AWS", kind: "MODEL_DEPLOYMENT",
      monthlyCostUsd: 1400, utilizationPercent: 55, regions: ["US-EAST", "EU-WEST"],
      useCaseLabels: ["Financial Forecasting", "Data Intelligence"],
      tags: { pricing: "paid", planName: "On-Demand" },
    },
  },
  {
    id: "a-vertex", label: "Vertex AI", nodeType: "ASSET",
    attributes: {
      vendorId: "v-google", vendor: "Google Cloud", kind: "MODEL_DEPLOYMENT",
      monthlyCostUsd: 1200, utilizationPercent: 68, regions: ["EU-WEST"],
      useCaseLabels: ["Financial Forecasting", "Workflow Automation"],
      tags: { pricing: "paid", planName: "Pay-as-you-go" },
    },
  },
  {
    id: "a-hf-inference", label: "HF Inference API", nodeType: "ASSET",
    attributes: {
      vendorId: "v-huggingface", vendor: "Hugging Face", kind: "MODEL_DEPLOYMENT",
      monthlyCostUsd: 400, utilizationPercent: 30, regions: ["US-EAST"],
      useCaseLabels: ["Workflow Automation", "Data Intelligence"],
      tags: { pricing: "freemium", planName: "Pro" },
    },
  },
  {
    id: "a-langchain", label: "LangChain Cloud", nodeType: "ASSET",
    attributes: {
      vendorId: "v-langchain", vendor: "LangChain", kind: "MODEL_DEPLOYMENT",
      monthlyCostUsd: 200, utilizationPercent: 90, regions: ["US-EAST"],
      useCaseLabels: ["Workflow Automation", "Knowledge Management"],
      tags: { pricing: "freemium", planName: "Plus" },
    },
  },
  {
    id: "a-pinecone", label: "Pinecone Vector DB", nodeType: "ASSET",
    attributes: {
      vendorId: "v-pinecone", vendor: "Pinecone", kind: "MODEL_DEPLOYMENT",
      monthlyCostUsd: 500, utilizationPercent: 78, regions: ["US-EAST", "EU-WEST"],
      useCaseLabels: ["Knowledge Management", "Data Intelligence"],
      tags: { pricing: "subscription", planName: "Standard" },
    },
  },
  {
    id: "a-gpu", label: "GPU Cluster (p3.16xlarge)", nodeType: "ASSET",
    attributes: {
      vendorId: "v-aws", vendor: "AWS", kind: "HARDWARE",
      monthlyCostUsd: 8500, utilizationPercent: 45, regions: ["US-EAST"],
      vcpus: 64, capacityGb: 128, region: "us-east-1",
      tags: { pricePerHour: "14.69", workload: "Model Training" },
    },
  },
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
