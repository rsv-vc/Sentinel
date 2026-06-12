import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { DatasetsClient } from "./DatasetsClient";

export const metadata: Metadata = { title: "Data Sets" };

const mockDatasets = [
  { id: "ds-1", label: "Customer Profiles DB", nodeType: "DATA_ASSET", attributes: { sensitivity: "HIGH", category: "Customer Data", description: "Core CRM records including contact and transaction history", containsPii: true, regions: ["US-EAST", "EU-WEST"] } },
  { id: "ds-2", label: "Product Catalog", nodeType: "DATA_ASSET", attributes: { sensitivity: "LOW", category: "Product Data", description: "Structured product listings, pricing and inventory", containsPii: false, regions: ["US-EAST"] } },
  { id: "ds-3", label: "Support Ticket Archive", nodeType: "DATA_ASSET", attributes: { sensitivity: "MEDIUM", category: "Support Data", description: "Historical support conversations and resolution notes", containsPii: true, regions: ["US-EAST", "US-WEST"] } },
  { id: "ds-4", label: "Employee Records", nodeType: "DATA_ASSET", attributes: { sensitivity: "HIGH", category: "HR Data", description: "Personnel files, compensation and performance data", containsPii: true, regions: ["US-EAST"] } },
  { id: "ds-5", label: "Web Analytics Events", nodeType: "DATA_ASSET", attributes: { sensitivity: "LOW", category: "Analytics", description: "Clickstream and session data from web properties", containsPii: false, regions: ["US-EAST", "EU-WEST", "APAC"] } },
  { id: "ds-6", label: "Financial Transactions", nodeType: "DATA_ASSET", attributes: { sensitivity: "HIGH", category: "Finance", description: "Payment records, invoices and revenue reporting data", containsPii: true, regions: ["US-EAST"] } },
  { id: "ds-7", label: "Model Training Corpus", nodeType: "DATA_ASSET", attributes: { sensitivity: "MEDIUM", category: "ML Data", description: "Curated text and structured data for fine-tuning", containsPii: false, regions: ["US-EAST", "US-WEST"] } },
  { id: "ds-8", label: "Vendor Contracts", nodeType: "DATA_ASSET", attributes: { sensitivity: "MEDIUM", category: "Legal", description: "Third-party agreements and SLA documentation", containsPii: false, regions: ["US-EAST"] } },
];

export default function DatasetsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Data Sets"
        subtitle="Data assets that flow through your AI estate."
      />
      <DatasetsClient datasets={mockDatasets as any} />
    </div>
  );
}
