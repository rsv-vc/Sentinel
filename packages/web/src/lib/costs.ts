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

// Per-tool utilization estimates based on deployment type
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

// MoM growth ~8%: last month costs are ~93% of current
function lastMonth(current: number): number {
  return Math.round(current * 0.93);
}

export const SEEDED_COSTS: ToolCostBreakdown[] = SOFTWARE_ASSETS.map((a) => {
  const attrs = a.attributes as any;
  const monthly = attrs.monthlyCostUsd as number;
  return {
    toolId:              a.id,
    toolName:            a.label,
    vendor:              attrs.vendor,
    team:                TEAM_DISPLAY[attrs.tags?.team] ?? attrs.tags?.team ?? "Other",
    costCategory:        "Software" as const,
    monthlyCostUsd:      monthly,
    annualCostUsd:       monthly * 12,
    lastMonthCostUsd:    lastMonth(monthly),
    utilizationPercent:  UTILIZATION[a.id] ?? 60,
  };
});

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
      "Jasper AI ($1,200/mo) and Grammarly Business ($900/mo) both serve the Sales team for content drafting, and Microsoft 365 Copilot already covers the same workflow for Operations.",
    affectedTools: ["sw-jasper", "sw-grammarly", "sw-copilot365"],
    potentialSavingsUsd: 1800,
    priority: "high",
    implementation:
      "Retire Jasper subscription (low 48% utilisation). Evaluate whether Grammarly adds enough value over M365 Copilot. Total saving if both retired: $2,100/month.",
  },
  {
    id: "rec-3",
    type: "pricing-strategy",
    title: "Switch monthly SaaS to annual contracts",
    description:
      "Pinecone, Weaviate, Workato, and Glean are all on monthly billing. Annual commitments for these four tools typically unlock 20–30% discounts.",
    affectedTools: ["sw-pinecone", "sw-weaviate", "sw-workato", "sw-glean"],
    potentialSavingsUsd: 1500,
    priority: "medium",
    implementation:
      "Negotiate annual contracts for tools with utilisation > 70%: Pinecone (84%), Glean (79%), Workato (72%). Expected saving: $1,200–$1,800/month.",
  },
];

export function calculateCostMetrics(costs: ToolCostBreakdown[]) {
  const totalMonthly = costs.reduce((sum, c) => sum + c.monthlyCostUsd, 0);
  const totalAnnual = costs.reduce((sum, c) => sum + c.annualCostUsd, 0);
  const lastMonthTotal = costs.reduce((sum, c) => sum + c.lastMonthCostUsd, 0);
  const monthOverMonthTrend = ((totalMonthly - lastMonthTotal) / lastMonthTotal) * 100;

  const byCostCategory: Record<string, number> = {
    Software:       0,
    GPU:            0,
    Training:       0,
    Infrastructure: 0,
  };
  costs.forEach((cost) => {
    byCostCategory[cost.costCategory] += cost.monthlyCostUsd;
  });

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
      Software:       { name: "Software",       cost: 0, color: "#8A9C8B" },
      GPU:            { name: "GPU Compute",     cost: 0, color: "#d4836e" },
      Training:       { name: "Training",        cost: 0, color: "#C4924A" },
      Infrastructure: { name: "Infrastructure",  cost: 0, color: "#9a9078" },
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

// 12-month trend aligned to current $48,100/month total (budget $55,000)
export function getTrendData() {
  return [
    { month: "Jul",  cost: 39200,  budget: 55000 },
    { month: "Aug",  cost: 40100,  budget: 55000 },
    { month: "Sep",  cost: 40900,  budget: 55000 },
    { month: "Oct",  cost: 41800,  budget: 55000 },
    { month: "Nov",  cost: 42600,  budget: 55000 },
    { month: "Dec",  cost: 43200,  budget: 55000 },
    { month: "Jan",  cost: 43900,  budget: 55000 },
    { month: "Feb",  cost: 44700,  budget: 55000 },
    { month: "Mar",  cost: 45400,  budget: 55000 },
    { month: "Apr",  cost: 46200,  budget: 55000 },
    { month: "May",  cost: 47100,  budget: 55000 },
    { month: "Jun",  cost: 48100,  budget: 55000 },
  ];
}
