import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardTitle } from "@/components/Card";
import { ConfidenceBadge, NodeTypeBadge, SourceBadge } from "@/components/Badge";

export const metadata: Metadata = { title: "Node Detail" };

const MOCK_NODES: Record<string, { label: string; type: string; description?: string }> = {
  "v-anthropic":   { label: "Anthropic",              type: "VENDOR",     description: "Leading AI safety company and LLM provider" },
  "v-openai":      { label: "OpenAI",                 type: "VENDOR",     description: "AI research and deployment company" },
  "v-aws":         { label: "Amazon Web Services",    type: "VENDOR",     description: "Cloud infrastructure and ML services" },
  "v-google":      { label: "Google Cloud",           type: "VENDOR",     description: "Cloud platform and AI services" },
  "a-claude":      { label: "Claude API",             type: "ASSET",      description: "Anthropic's Claude language model API" },
  "a-gpt4":        { label: "GPT-4 API",              type: "ASSET",      description: "OpenAI GPT-4 large language model" },
  "a-gpu":         { label: "GPU Cluster",            type: "ASSET",      description: "AWS p3.16xlarge GPU instances for training" },
  "a-bedrock":     { label: "AWS Bedrock",            type: "ASSET",      description: "Managed foundation model service" },
  "ds-1":          { label: "Customer Profiles DB",   type: "DATA_ASSET", description: "Core CRM records including PII" },
};

export default async function NodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const nodeData = MOCK_NODES[decodedId] ?? { label: decodedId, type: "ASSET", description: "Node details" };

  const mockNode = {
    id: decodedId,
    label: nodeData.label,
    type: nodeData.type,
    confidence: "HIGH",
    source: "TELEMETRY",
    confirmed: true,
    attributes: { description: nodeData.description },
  };

  const mockNeighbours = [
    { id: "uc-1", label: "Knowledge Management Assistant", type: "USE_CASE", confidence: "HIGH", source: "MANUAL" },
    { id: "uc-3", label: "Customer Support Triage", type: "USE_CASE", confidence: "HIGH", source: "MANUAL" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-[#5c5248]">
        <Link href="/inventory" className="hover:text-[#9a9078] transition-colors">Inventory</Link>
        <span>/</span>
        <span className="text-[#9a9078]">{mockNode.label}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#D9C8B4]">{mockNode.label}</h1>
          <p className="text-xs text-[#5c5248] font-mono mt-1">{mockNode.id}</p>
          {nodeData.description && <p className="text-sm text-[#9a9078] mt-2">{nodeData.description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <NodeTypeBadge type={mockNode.type as any} />
          <ConfidenceBadge confidence={mockNode.confidence as any} />
          <SourceBadge source={mockNode.source as any} />
        </div>
      </div>

      <Card>
        <CardTitle>Node Attributes</CardTitle>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {[
            { label: "ID", value: mockNode.id },
            { label: "Type", value: mockNode.type },
            { label: "Confidence", value: mockNode.confidence },
            { label: "Source", value: mockNode.source },
            { label: "Confirmed", value: mockNode.confirmed ? "Yes" : "No" },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-lg border border-[#2a2825] bg-[#1e1c1a]">
              <p className="text-xs text-[#5c5248] uppercase tracking-wide mb-1">{label}</p>
              <p className="text-sm font-medium text-[#D9C8B4]">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Connected Use Cases ({mockNeighbours.length})</CardTitle>
        <div className="space-y-2 mt-2">
          {mockNeighbours.map((n) => (
            <Link
              key={n.id}
              href={`/use-cases/${encodeURIComponent(n.id)}`}
              className="flex items-center justify-between p-3 rounded-lg border border-[#2a2825] hover:border-[#8A9C8B44] hover:bg-[#1e2420] transition-all group"
            >
              <span className="text-sm font-medium text-[#D9C8B4] group-hover:text-[#9baf9c]">{n.label}</span>
              <div className="flex gap-2">
                <NodeTypeBadge type={n.type as any} />
                <ConfidenceBadge confidence={n.confidence as any} />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
