import { SOFTWARE_ASSETS } from "./mockAssets";

export interface ToolCostBreakdown {
  toolId: string;
  toolName: string;
  vendor: string;
  team: string;
  costCategory: "Software" | "GPU" | "Training" | "Infrastructure";
  monthlyCostUsd: number;
  annualCostUsd: number;
  lastMonthCostUsd: number;
  utilizationPercent: number;
}

export interface OptimizationRecommendation {
  id: string;
  type: "consolidation" | "redundancy" | "pricing-strategy";
  title: string;
  description: string;
  affectedTools: string[];
  potentialSavingsUsd: number;
  priority: "high" | "medium" | "low";
  implementation: string;
}

const TEAM_DISPLAY: Record<string, string> = {
  product:  "Product",
  "cx-ai":  "CX & AI",
  sales:    "Sales",
  finance:  "Finance",
  strategy: "Strategy",
  ops:      "Operations",
  legal:    "Legal",
};

const UTILIZATION: Record<string, number> = {
  "sw-claude-sonnet":  88,
  "sw-claude-haiku":   82,
  "sw-gpt4-turbo":     75,
  "sw-gpt35":          70,
  "sw-dalle3":         42,
  "sw-whisper":        65,
  "sw-vertex":         55,
  "sw-bedrock":        60,
  "sw-github-copilot": 92,
  "sw-azure-openai":   68,
  "sw-copilot365":     85,
  "sw-notion-ai":      78,
  "sw-einstein":       72,
  "sw-intercom-fin":   80,
  "sw-zendesk-ai":     76,
  "sw-grammarly":      90,
  "sw-jasper":         48,
  "sw-mistral":        58,
  "sw-cohere":         66,
  "sw-pinecone":       84,
  "sw-weaviate":       62,
  "sw-langchain":      95,
  "sw-hf-inference":   44,
  "sw-together":       52,
  "sw-databricks":     70,
  "sw-snowflake":      74,
  "sw-scale":          40,
  "sw-wandb":          86,
  "sw-elevenlabs":     55,
  "sw-deepgram":       68,
  "sw-glean":          79,
  "sw-workato":        72,
  "sw-workday-ai":     83,
};

function lastMonth(current: number): number {
  return Math.round(current * 0.93);
}

// Software tools — $48,100 / mo
const softwareCosts: ToolCostBreakdown[] = SOFTWARE_ASSETS.map((a) => {
  const attrs = a.attributes as any;
  const monthly = attrs.monthlyCostUsd as number;
  return {
    toolId:             a.id,
    toolName:           a.label,
    vendor:             attrs.vendor,
    team:               TEAM_DISPLAY[attrs.tags?.team] ?? attrs.tags?.team ?? "Other",
    costCategory:       "Software" as const,
    monthlyCostUsd:     monthly,
    annualCostUsd:      monthly * 12,
    lastMonthCostUsd:   lastMonth(monthly),
    utilizationPercent: UTILIZATION[a.id] ?? 60,
  };
});

// GPU Compute — $18,100 / mo
const gpuCosts: ToolCostBreakdown[] = [
  { toolId: "gpu-aws-training",  toolName: "AWS p4d Training Cluster",     vendor: "AWS",          team: "Operations", costCategory: "GPU", monthlyCostUsd: 8500, annualCostUsd: 102000, lastMonthCostUsd: 7900, utilizationPercent: 72 },
  { toolId: "gpu-aws-inference", toolName: "AWS g5 Inference Fleet",        vendor: "AWS",          team: "CX & AI",    costCategory: "GPU", monthlyCostUsd: 3200, annualCostUsd: 38400,  lastMonthCostUsd: 3100, utilizationPercent: 65 },
  { toolId: "gpu-gcp-training",  toolName: "GCP A100 80 GB Training Node",  vendor: "Google Cloud", team: "Finance",    costCategory: "GPU", monthlyCostUsd: 6400, annualCostUsd: 76800,  lastMonthCostUsd: 6000, utilizationPercent: 55 },
];

// Training & Fine-tuning — $3,600 / mo
const trainingCosts: ToolCostBreakdown[] = [
  { toolId: "tr-finetuning",  toolName: "LLM Fine-tuning Budget",  vendor: "AWS", team: "Product", costCategory: "Training", monthlyCostUsd: 2400, annualCostUsd: 28800, lastMonthCostUsd: 2200, utilizationPercent: 80 },
  { toolId: "tr-experiments", toolName: "ML Experiment Compute",   vendor: "AWS", team: "Product", costCategory: "Training", monthlyCostUsd: 1200, annualCostUsd: 14400, lastMonthCostUsd: 1100, utilizationPercent: 60 },
];

// Infrastructure — $2,900 / mo
const infraCosts: ToolCostBreakdown[] = [
  { toolId: "infra-storage",    toolName: "AI Data Lake (S3)",              vendor: "AWS",      team: "Operations", costCategory: "Infrastructure", monthlyCostUsd: 900,  annualCostUsd: 10800, lastMonthCostUsd: 850,  utilizationPercent: 82 },
  { toolId: "infra-monitoring", toolName: "AI Observability (Datadog)",     vendor: "Datadog",  team: "Operations", costCategory: "Infrastructure", monthlyCostUsd: 1400, annualCostUsd: 16800, lastMonthCostUsd: 1300, utilizationPercent: 90 },
  { toolId: "infra-vector",     toolName: "Vector DB Infrastructure (AWS)", vendor: "AWS",      team: "Operations", costCategory: "Infrastructure", monthlyCostUsd: 600,  annualCostUsd: 7200,  lastMonthCostUsd: 560,  utilizationPercent: 75 },
];

// Total: Software $48,100 + GPU $18,100 + Training $3,600 + Infra $2,900 = $72,700 / mo
export const SEEDED_COSTS: ToolCostBreakdown[] = [
  ...softwareCosts,
  ...gpuCosts,
  ...trainingCosts,
  ...infraCosts,
];

export const OPTIMIZATION_RECS: OptimizationRecommendation[] = [
  {
    id: "rec-1",
    type: "consolidation",
    title: "Consolidate overlapping LLM APIs",
    description:
      "GPT-4 Turbo, Azure OpenAI, and Claude 3.5 Sonnet serve overlapping use cases. Standardising on Claude Sonnet for long-context workloads and GPT-3.5 for high-volume triage can cut inference costs by ~25%.",
    affectedTools: ["sw-gpt4-turbo", "sw-azure-openai", "sw-claude-sonnet"],
    potentialSavingsUsd: 2200,
    priority: "high",
    implementation:
      "Audit call patterns in Data Team and Sales Team. Migrate overlapping GPT-4 workloads to Claude Sonnet; retire Azure OpenAI redundant endpoints. Estimated saving: $1,800–$2,400/month.",
  },
  {
    id: "rec-2",
    type: "redundancy",
    title: "Remove duplicate content-writing tools",
    description:
      "Jasper AI ($1,200/mo, 48% utilisation) and Grammarly Business ($900/mo) both serve Sales for content drafting, while M365 Copilot already covers the same workflow for Operations.",
    affectedTools: ["sw-jasper", "sw-grammarly", "sw-copilot365"],
    potentialSavingsUsd: 1800,
    priority: "high",
    implementation:
      "Retire Jasper subscription (48% utilisation). Evaluate whether Grammarly adds value over M365 Copilot. Total saving if both retired: $2,100/month.",
  },
  {
    id: "rec-3",
    type: "pricing-strategy",
    title: "Switch monthly SaaS to annual contracts",
    description:
      "Pinecone, Weaviate, Workato, and Glean are on monthly billing. Annual commitments typically unlock 20–30% discounts for all four.",
    affectedTools: ["sw-pinecone", "sw-weaviate", "sw-workato", "sw-glean"],
    potentialSavingsUsd: 1500,
    priority: "medium",
    implementation:
      "Negotiate annual contracts for tools with utilisation > 70%: Pinecone (84%), Glean (79%), Workato (72%). Expected saving: $1,200–$1,800/month.",
  },
];

export function calculateCostMetrics(costs: ToolCostBreakdown[]) {
  const totalMonthly   = costs.reduce((sum, c) => sum + c.monthlyCostUsd, 0);
  const totalAnnual    = costs.reduce((sum, c) => sum + c.annualCostUsd, 0);
  const lastMonthTotal = costs.reduce((sum, c) => sum + c.lastMonthCostUsd, 0);
  const monthOverMonthTrend = ((totalMonthly - lastMonthTotal) / lastMonthTotal) * 100;

  const byCostCategory: Record<string, number> = {
    Software: 0, GPU: 0, Training: 0, Infrastructure: 0,
  };
  costs.forEach((c) => { byCostCategory[c.costCategory] += c.monthlyCostUsd; });

  const potentialSavings = OPTIMIZATION_RECS.reduce((sum, r) => sum + r.potentialSavingsUsd, 0);

  return {
    totalMonthly,
    totalAnnual,
    monthOverMonthTrend,
    byCostCategory,
    potentialSavings,
    savingsPercentage: (potentialSavings / totalMonthly) * 100,
  };
}

export function getCostsByBreakdown(
  costs: ToolCostBreakdown[],
  breakdownType: "category" | "tool" | "team"
) {
  if (breakdownType === "category") {
    const grouped: Record<string, { name: string; cost: number; color: string }> = {
      Software:       { name: "Software",      cost: 0, color: "#8A9C8B" },
      GPU:            { name: "GPU Compute",    cost: 0, color: "#d4836e" },
      Training:       { name: "Training",       cost: 0, color: "#C4924A" },
      Infrastructure: { name: "Infrastructure", cost: 0, color: "#9a9078" },
    };
    costs.forEach((c) => { grouped[c.costCategory].cost += c.monthlyCostUsd; });
    return Object.values(grouped).sort((a, b) => b.cost - a.cost);
  }

  if (breakdownType === "tool") {
    return costs
      .map((c) => ({ name: c.toolName, cost: c.monthlyCostUsd, vendor: c.vendor, category: c.costCategory }))
      .sort((a, b) => b.cost - a.cost);
  }

  if (breakdownType === "team") {
    const grouped: Record<string, number> = {};
    costs.forEach((c) => { grouped[c.team] = (grouped[c.team] ?? 0) + c.monthlyCostUsd; });
    return Object.entries(grouped)
      .map(([team, cost]) => ({ name: team, cost }))
      .sort((a, b) => b.cost - a.cost);
  }

  return [];
}

// 12-month trend: $72,700/mo current total, budget $85,000
export function getTrendData() {
  return [
    { month: "Jul", cost: 58400, budget: 85000 },
    { month: "Aug", cost: 60100, budget: 85000 },
    { month: "Sep", cost: 61400, budget: 85000 },
    { month: "Oct", cost: 62800, budget: 85000 },
    { month: "Nov", cost: 64200, budget: 85000 },
    { month: "Dec", cost: 65500, budget: 85000 },
    { month: "Jan", cost: 66900, budget: 85000 },
    { month: "Feb", cost: 68200, budget: 85000 },
    { month: "Mar", cost: 69400, budget: 85000 },
    { month: "Apr", cost: 70600, budget: 85000 },
    { month: "May", cost: 71700, budget: 85000 },
    { month: "Jun", cost: 72700, budget: 85000 },
  ];
}
