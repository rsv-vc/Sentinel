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
  { id: "v-anthropic",  label: "Anthropic",    nodeType: "VENDOR", attributes: {} },
  { id: "v-openai",     label: "OpenAI",        nodeType: "VENDOR", attributes: {} },
  { id: "v-aws",        label: "AWS",           nodeType: "VENDOR", attributes: {} },
  { id: "v-google",     label: "Google Cloud",  nodeType: "VENDOR", attributes: {} },
  { id: "v-huggingface",label: "Hugging Face",  nodeType: "VENDOR", attributes: {} },
  { id: "v-langchain",  label: "LangChain",     nodeType: "VENDOR", attributes: {} },
  { id: "v-pinecone",   label: "Pinecone",      nodeType: "VENDOR", attributes: {} },
];

const mockAssets = [
  {
    id: "a-claude", label: "Claude API", nodeType: "ASSET",
    attributes: {
      vendor: "Anthropic", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 2500,
      useCaseLabels: ["Knowledge Management Assistant", "Code Review Assistant", "HR Policy Chatbot", "Workflow Automation"],
    },
  },
  {
    id: "a-gpt4", label: "GPT-4 API", nodeType: "ASSET",
    attributes: {
      vendor: "OpenAI", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 3200,
      useCaseLabels: ["Document Creation Copilot", "Customer Support Triage"],
    },
  },
  {
    id: "a-gpt35", label: "GPT-3.5 Turbo", nodeType: "ASSET",
    attributes: {
      vendor: "OpenAI", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 800,
      useCaseLabels: ["Customer Support Triage", "HR Policy Chatbot"],
    },
  },
  {
    id: "a-bedrock", label: "AWS Bedrock", nodeType: "ASSET",
    attributes: {
      vendor: "AWS", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 1400,
      useCaseLabels: ["Financial Forecasting Model", "Data Pipeline Intelligence"],
    },
  },
  {
    id: "a-vertex", label: "Vertex AI", nodeType: "ASSET",
    attributes: {
      vendor: "Google Cloud", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 1200,
      useCaseLabels: ["Financial Forecasting Model"],
    },
  },
  {
    id: "a-pinecone", label: "Pinecone Vector DB", nodeType: "ASSET",
    attributes: {
      vendor: "Pinecone", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 500,
      useCaseLabels: ["Knowledge Management Assistant", "Data Pipeline Intelligence"],
    },
  },
  {
    id: "a-langchain", label: "LangChain Cloud", nodeType: "ASSET",
    attributes: {
      vendor: "LangChain", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 200,
      useCaseLabels: ["Workflow Automation", "Document Creation Copilot"],
    },
  },
  {
    id: "a-hf", label: "HF Inference API", nodeType: "ASSET",
    attributes: {
      vendor: "Hugging Face", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 400,
      useCaseLabels: ["Data Pipeline Intelligence", "Workflow Automation"],
    },
  },
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
