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

export const SEEDED_COSTS: ToolCostBreakdown[] = [
  // Software - LLM APIs
  { toolId: "claude-api", toolName: "Claude API", vendor: "Anthropic", team: "ML Team",
    costCategory: "Software", monthlyCostUsd: 2500, annualCostUsd: 30000, lastMonthCostUsd: 2400, utilizationPercent: 85 },
  { toolId: "openai-gpt4", toolName: "OpenAI GPT-4", vendor: "OpenAI", team: "Data Team",
    costCategory: "Software", monthlyCostUsd: 3200, annualCostUsd: 38400, lastMonthCostUsd: 3100, utilizationPercent: 72 },
  { toolId: "gemini-api", toolName: "Google Gemini", vendor: "Google Cloud", team: "Research",
    costCategory: "Software", monthlyCostUsd: 1800, annualCostUsd: 21600, lastMonthCostUsd: 1750, utilizationPercent: 45 },

  // Software - Tools & SaaS
  { toolId: "langchain", toolName: "LangChain Pro", vendor: "LangChain Inc", team: "Platform",
    costCategory: "Software", monthlyCostUsd: 500, annualCostUsd: 6000, lastMonthCostUsd: 500, utilizationPercent: 95 },
  { toolId: "pinecone", toolName: "Pinecone Vector DB", vendor: "Pinecone", team: "ML Team",
    costCategory: "Software", monthlyCostUsd: 400, annualCostUsd: 4800, lastMonthCostUsd: 400, utilizationPercent: 88 },

  // GPU Compute
  { toolId: "gpu-cluster-us", toolName: "GPU Cluster (US)", vendor: "AWS", team: "Compute Ops",
    costCategory: "GPU", monthlyCostUsd: 8500, annualCostUsd: 102000, lastMonthCostUsd: 8200, utilizationPercent: 45 },
  { toolId: "gpu-cluster-eu", toolName: "GPU Cluster (EU)", vendor: "GCP", team: "Compute Ops",
    costCategory: "GPU", monthlyCostUsd: 5200, annualCostUsd: 62400, lastMonthCostUsd: 5100, utilizationPercent: 38 },

  // Training & Fine-tuning
  { toolId: "model-training", toolName: "Model Training Jobs", vendor: "Internal", team: "ML Team",
    costCategory: "Training", monthlyCostUsd: 1200, annualCostUsd: 14400, lastMonthCostUsd: 1200, utilizationPercent: 100 },
  { toolId: "finetuning-api", toolName: "Fine-tuning API", vendor: "OpenAI", team: "Data Team",
    costCategory: "Training", monthlyCostUsd: 800, annualCostUsd: 9600, lastMonthCostUsd: 600, utilizationPercent: 62 },

  // Infrastructure
  { toolId: "cloud-storage", toolName: "Cloud Storage (S3)", vendor: "AWS", team: "Infra",
    costCategory: "Infrastructure", monthlyCostUsd: 800, annualCostUsd: 9600, lastMonthCostUsd: 750, utilizationPercent: 68 },
  { toolId: "vector-storage", toolName: "Vector Storage", vendor: "GCP", team: "ML Team",
    costCategory: "Infrastructure", monthlyCostUsd: 600, annualCostUsd: 7200, lastMonthCostUsd: 550, utilizationPercent: 72 },
  { toolId: "logging-monitoring", toolName: "Logging & Monitoring", vendor: "Datadog", team: "Infra",
    costCategory: "Infrastructure", monthlyCostUsd: 1200, annualCostUsd: 14400, lastMonthCostUsd: 1200, utilizationPercent: 90 },
];

export const OPTIMIZATION_RECS: OptimizationRecommendation[] = [
  {
    id: "rec-1",
    type: "consolidation",
    title: "Consolidate LLM providers",
    description: "Both Claude and GPT-4 are used. Consolidating to Claude API would reduce costs by negotiated enterprise pricing.",
    affectedTools: ["claude-api", "openai-gpt4"],
    potentialSavingsUsd: 1200,
    priority: "high",
    implementation: "Audit GPT-4 usage in Data Team, migrate compatible workloads to Claude. Potential cost reduction: 25-30%."
  },
  {
    id: "rec-2",
    type: "redundancy",
    title: "Optimize GPU cluster utilization",
    description: "EU GPU cluster is underutilized at 38%. Consolidating EU workloads to US cluster would save 60% on regional costs.",
    affectedTools: ["gpu-cluster-us", "gpu-cluster-eu"],
    potentialSavingsUsd: 3100,
    priority: "high",
    implementation: "Migrate EU workloads to US cluster with regional caching. Consider reserved instances for baseline capacity."
  },
  {
    id: "rec-3",
    type: "pricing-strategy",
    title: "Switch to annual commitment plans",
    description: "Converting monthly subscriptions (LangChain, Pinecone, Datadog) to annual plans saves 20-25% per service.",
    affectedTools: ["langchain", "pinecone", "logging-monitoring"],
    potentialSavingsUsd: 500,
    priority: "medium",
    implementation: "Negotiate annual contracts for high-utilization services. Estimated savings: $500-1000/month."
  },
];

export function calculateCostMetrics(costs: ToolCostBreakdown[]) {
  const totalMonthly = costs.reduce((sum, c) => sum + c.monthlyCostUsd, 0);
  const totalAnnual = costs.reduce((sum, c) => sum + c.annualCostUsd, 0);
  const lastMonthTotal = costs.reduce((sum, c) => sum + c.lastMonthCostUsd, 0);
  const monthOverMonthTrend = ((totalMonthly - lastMonthTotal) / lastMonthTotal) * 100;

  const byCostCategory = {
    Software: 0,
    GPU: 0,
    Training: 0,
    Infrastructure: 0,
  };

  costs.forEach((cost) => {
    byCostCategory[cost.costCategory] += cost.monthlyCostUsd;
  });

  const potentialSavings = OPTIMIZATION_RECS.reduce((sum, rec) => sum + rec.potentialSavingsUsd, 0);

  return {
    totalMonthly,
    totalAnnual,
    monthOverMonthTrend,
    byCostCategory,
    potentialSavings,
    savingsPercentage: (potentialSavings / totalMonthly) * 100,
  };
}

export function getCostsByBreakdown(costs: ToolCostBreakdown[], breakdownType: "category" | "tool" | "team") {
  if (breakdownType === "category") {
    const grouped: Record<string, { name: string; cost: number; color: string }> = {
      Software: { name: "Software", cost: 0, color: "#8A9C8B" },
      GPU: { name: "GPU Compute", cost: 0, color: "#d4836e" },
      Training: { name: "Training", cost: 0, color: "#C4924A" },
      Infrastructure: { name: "Infrastructure", cost: 0, color: "#9a9078" },
    };

    costs.forEach((cost) => {
      grouped[cost.costCategory].cost += cost.monthlyCostUsd;
    });

    return Object.values(grouped).sort((a, b) => b.cost - a.cost);
  }

  if (breakdownType === "tool") {
    return costs
      .map((cost) => ({
        name: cost.toolName,
        cost: cost.monthlyCostUsd,
        vendor: cost.vendor,
        category: cost.costCategory,
      }))
      .sort((a, b) => b.cost - a.cost);
  }

  if (breakdownType === "team") {
    const grouped: Record<string, number> = {};

    costs.forEach((cost) => {
      grouped[cost.team] = (grouped[cost.team] ?? 0) + cost.monthlyCostUsd;
    });

    return Object.entries(grouped)
      .map(([team, cost]) => ({ name: team, cost }))
      .sort((a, b) => b.cost - a.cost);
  }

  return [];
}

// Mock 12-month trend data
export function getTrendData() {
  return [
    { month: "Jan", cost: 15200, budget: 18000 },
    { month: "Feb", cost: 15600, budget: 18000 },
    { month: "Mar", cost: 15400, budget: 18000 },
    { month: "Apr", cost: 15900, budget: 18000 },
    { month: "May", cost: 16100, budget: 18000 },
    { month: "Jun", cost: 16197, budget: 18000 },
    { month: "Jul", cost: 16000, budget: 18000 },
    { month: "Aug", cost: 15800, budget: 18000 },
    { month: "Sep", cost: 16200, budget: 18000 },
    { month: "Oct", cost: 16400, budget: 18000 },
    { month: "Nov", cost: 15900, budget: 18000 },
    { month: "Dec", cost: 17200, budget: 18000 },
  ];
}
