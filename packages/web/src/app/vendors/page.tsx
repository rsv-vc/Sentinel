import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { VendorsClient } from "./VendorsClient";
import { ALL_MOCK_ASSETS, ALL_MOCK_VENDORS } from "@/lib/mockAssets";

export const metadata: Metadata = { title: "Vendors" };

const WEBSITE: Record<string, string> = {
  "Anthropic":       "anthropic.com",
  "OpenAI":          "openai.com",
  "Google Cloud":    "cloud.google.com",
  "AWS":             "aws.amazon.com",
  "Microsoft":       "microsoft.com",
  "Microsoft Azure": "azure.microsoft.com",
  "Notion Labs":     "notion.so",
  "Salesforce":      "salesforce.com",
  "Intercom":        "intercom.com",
  "Zendesk":         "zendesk.com",
  "Grammarly":       "grammarly.com",
  "Jasper":          "jasper.ai",
  "Mistral AI":      "mistral.ai",
  "Cohere":          "cohere.com",
  "Pinecone":        "pinecone.io",
  "Weaviate":        "weaviate.io",
  "LangChain":       "langchain.com",
  "Hugging Face":    "huggingface.co",
  "Together AI":     "together.ai",
  "Databricks":      "databricks.com",
  "Snowflake":       "snowflake.com",
  "Scale AI":        "scale.com",
  "Weights & Biases":"wandb.ai",
  "ElevenLabs":      "elevenlabs.io",
  "Deepgram":        "deepgram.com",
  "Glean":           "glean.com",
  "Workato":         "workato.com",
  "Workday":         "workday.com",
  "Lambda Labs":     "lambdalabs.com",
  "CoreWeave":       "coreweave.com",
  "RunPod":          "runpod.io",
  "Paperspace":      "paperspace.com",
  "Vast.ai":         "vast.ai",
  "Oracle Cloud":    "oracle.com/cloud",
  "Modal":           "modal.com",
  "IBM Cloud":       "ibm.com/cloud",
};

const mockVendors = ALL_MOCK_VENDORS.map((v) => ({
  ...v,
  attributes: { ...v.attributes, website: WEBSITE[v.label] ?? "" },
}));

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Vendors"
        subtitle="All AI vendors and their tools across your estate."
      />
      <VendorsClient vendors={mockVendors as any} assets={ALL_MOCK_ASSETS as any} />
    </div>
  );
}
