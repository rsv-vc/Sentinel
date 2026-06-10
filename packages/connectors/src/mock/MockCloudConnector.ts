/**
 * MockCloudConnector — deterministic, realistic fake cloud estate.
 *
 * Returns the same data on every call (seeded constants, not Math.random()).
 * Designed to be a stand-in for a real connector during local development and demos.
 *
 * Estate modelled:
 *   Assets         — 20 GPU hardware instances across 10 providers (scraped from computestacker.com, June 2026)
 *   Models         — 24 business-productivity AI tool deployments
 *   Identity grants — none
 *   Egress events  — none
 */

import type {
  Asset,
  EgressEvent,
  IConnector,
  IdentityGrant,
  ModelDeployment,
} from "../types";

// ---------------------------------------------------------------------------
// Static seed data
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GPU Hardware Assets — sourced from computestacker.com/providers (June 2026)
// Monthly cost = hourly rate × 730 hrs. capacityGb = GPU VRAM.
// ---------------------------------------------------------------------------

const ASSETS: Asset[] = [

  // ── CoreWeave ──────────────────────────────────────────────────────────────
  {
    id: "coreweave::gpu::h100-sxm5-1x-us-east",
    kind: "GPU_INSTANCE",
    name: "CoreWeave — H100 SXM5 (1×)",
    vendor: "CoreWeave",
    region: "us-east-1",
    vcpus: 26,
    capacityGb: 80,           // VRAM GB
    monthlyCost: { amount: 4_497, currency: "USD" },   // $6.16/hr
    tags: { env: "production", team: "ml-platform", workload: "AI Training", category: "gpu-compute", pricePerHour: "6.16" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "coreweave::gpu::a100-80gb-pcie-1x-us-east",
    kind: "GPU_INSTANCE",
    name: "CoreWeave — A100 80GB PCIe (1×)",
    vendor: "CoreWeave",
    region: "us-east-1",
    vcpus: 12,
    capacityGb: 80,
    monthlyCost: { amount: 1_613, currency: "USD" },   // $2.21/hr
    tags: { env: "production", team: "ml-platform", workload: "Inference", category: "gpu-compute", pricePerHour: "2.21" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },

  // ── Lambda Labs ────────────────────────────────────────────────────────────
  {
    id: "lambda::gpu::h100-sxm5-1x-us-west",
    kind: "GPU_INSTANCE",
    name: "Lambda Labs — H100 SXM5 (1×)",
    vendor: "Lambda Labs",
    region: "us-west-2",
    vcpus: 26,
    capacityGb: 80,
    monthlyCost: { amount: 2_402, currency: "USD" },   // $3.29/hr
    tags: { env: "production", team: "research", workload: "AI Training", category: "gpu-compute", pricePerHour: "3.29" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "lambda::gpu::a100-40gb-sxm4-1x-us-west",
    kind: "GPU_INSTANCE",
    name: "Lambda Labs — A100 40GB SXM4 (1×)",
    vendor: "Lambda Labs",
    region: "us-west-2",
    vcpus: 14,
    capacityGb: 40,
    monthlyCost: { amount: 803, currency: "USD" },     // $1.10/hr
    tags: { env: "production", team: "research", workload: "Fine-tuning", category: "gpu-compute", pricePerHour: "1.10" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },

  // ── RunPod ─────────────────────────────────────────────────────────────────
  {
    id: "runpod::gpu::h100-sxm-secure-1x-us-east",
    kind: "GPU_INSTANCE",
    name: "RunPod — H100 SXM Secure Cloud (1×)",
    vendor: "RunPod",
    region: "us-east-1",
    vcpus: 24,
    capacityGb: 80,
    monthlyCost: { amount: 1_964, currency: "USD" },   // $2.69/hr
    tags: { env: "production", team: "ml-platform", workload: "AI Training", category: "gpu-compute", pricePerHour: "2.69" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "runpod::gpu::rtx-4090-community-1x-eu",
    kind: "GPU_INSTANCE",
    name: "RunPod — RTX 4090 Community (1×)",
    vendor: "RunPod",
    region: "eu-central-1",
    vcpus: 6,
    capacityGb: 24,
    monthlyCost: { amount: 321, currency: "USD" },     // $0.44/hr
    tags: { env: "development", team: "ml-platform", workload: "Inference", category: "gpu-compute", pricePerHour: "0.44" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },

  // ── Crusoe Cloud ───────────────────────────────────────────────────────────
  {
    id: "crusoe::gpu::h100-sxm5-1x-us-west",
    kind: "GPU_INSTANCE",
    name: "Crusoe Cloud — H100 SXM5 (1×)",
    vendor: "Crusoe Cloud",
    region: "us-west-1",
    vcpus: 24,
    capacityGb: 80,
    monthlyCost: { amount: 1_745, currency: "USD" },   // $2.39/hr
    tags: { env: "production", team: "ml-platform", workload: "AI Training", category: "gpu-compute", pricePerHour: "2.39" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "crusoe::gpu::l40s-1x-us-west",
    kind: "GPU_INSTANCE",
    name: "Crusoe Cloud — L40S (1×)",
    vendor: "Crusoe Cloud",
    region: "us-west-1",
    vcpus: 16,
    capacityGb: 48,
    monthlyCost: { amount: 942, currency: "USD" },     // $1.29/hr
    tags: { env: "production", team: "ml-platform", workload: "Inference", category: "gpu-compute", pricePerHour: "1.29" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },

  // ── Google Cloud (GCP) ─────────────────────────────────────────────────────
  {
    id: "gcp::gpu::a3-high-h100-1x-us-central",
    kind: "GPU_INSTANCE",
    name: "GCP — H100 80GB A3 High (1×)",
    vendor: "Google Cloud",
    region: "us-central1",
    vcpus: 26,
    capacityGb: 80,
    monthlyCost: { amount: 2_548, currency: "USD" },   // $3.49/hr
    tags: { env: "production", team: "ml-platform", workload: "AI Training", category: "gpu-compute", pricePerHour: "3.49" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "gcp::gpu::g2-standard-l4-1x-eu-west",
    kind: "GPU_INSTANCE",
    name: "GCP — L4 G2 Standard (1×)",
    vendor: "Google Cloud",
    region: "eu-west4",
    vcpus: 8,
    capacityGb: 24,
    monthlyCost: { amount: 511, currency: "USD" },     // $0.70/hr
    tags: { env: "production", team: "ml-platform", workload: "Inference", category: "gpu-compute", pricePerHour: "0.70" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },

  // ── Vast.ai ────────────────────────────────────────────────────────────────
  {
    id: "vastai::gpu::h100-pcie-1x-us-east",
    kind: "GPU_INSTANCE",
    name: "Vast.ai — H100 PCIe (1×)",
    vendor: "Vast.ai",
    region: "us-east-1",
    vcpus: 20,
    capacityGb: 80,
    monthlyCost: { amount: 1_117, currency: "USD" },   // $1.53/hr
    tags: { env: "production", team: "ml-platform", workload: "AI Training", category: "gpu-compute", pricePerHour: "1.53" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "vastai::gpu::rtx-4090-1x-eu-west",
    kind: "GPU_INSTANCE",
    name: "Vast.ai — RTX 4090 (1×)",
    vendor: "Vast.ai",
    region: "eu-west-1",
    vcpus: 8,
    capacityGb: 24,
    monthlyCost: { amount: 255, currency: "USD" },     // $0.35/hr
    tags: { env: "development", team: "research", workload: "Fine-tuning", category: "gpu-compute", pricePerHour: "0.35" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },

  // ── Civo ───────────────────────────────────────────────────────────────────
  {
    id: "civo::gpu::a100-80gb-1x-lon",
    kind: "GPU_INSTANCE",
    name: "Civo — A100 80GB (1×)",
    vendor: "Civo",
    region: "lon1",
    vcpus: 8,
    capacityGb: 80,
    monthlyCost: { amount: 876, currency: "USD" },     // $1.20/hr
    tags: { env: "production", team: "ml-platform", workload: "Inference", category: "gpu-compute", pricePerHour: "1.20" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },

  // ── AWS ────────────────────────────────────────────────────────────────────
  {
    id: "aws::gpu::p5-h100-sxm5-1x-us-east",
    kind: "GPU_INSTANCE",
    name: "AWS — H100 SXM5 p5 (1×)",
    vendor: "AWS",
    region: "us-east-1",
    vcpus: 8,
    capacityGb: 80,
    monthlyCost: { amount: 5_095, currency: "USD" },   // $6.98/hr
    tags: { env: "production", team: "ml-platform", workload: "AI Training", category: "gpu-compute", pricePerHour: "6.98" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },

  // ── Azure ──────────────────────────────────────────────────────────────────
  {
    id: "azure::gpu::nd-h100-v5-1x-eastus",
    kind: "GPU_INSTANCE",
    name: "Azure — H100 SXM ND H100 v5 (1×)",
    vendor: "Azure",
    region: "eastus",
    vcpus: 12,
    capacityGb: 80,
    monthlyCost: { amount: 1_124, currency: "USD" },   // $1.54/hr
    tags: { env: "production", team: "ml-platform", workload: "AI Training", category: "gpu-compute", pricePerHour: "1.54" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },

  // ── Thunder Compute ────────────────────────────────────────────────────────
  {
    id: "thunder::gpu::rtx-4090-1x-us-west",
    kind: "GPU_INSTANCE",
    name: "Thunder Compute — RTX 4090 (1×)",
    vendor: "Thunder Compute",
    region: "us-west-2",
    vcpus: 8,
    capacityGb: 24,
    monthlyCost: { amount: 328, currency: "USD" },     // $0.45/hr
    tags: { env: "development", team: "research", workload: "Fine-tuning", category: "gpu-compute", pricePerHour: "0.45" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },

  // ── Paperspace ─────────────────────────────────────────────────────────────
  {
    id: "paperspace::gpu::a100-80gb-1x-us-east",
    kind: "GPU_INSTANCE",
    name: "Paperspace — A100 80GB (1×)",
    vendor: "Paperspace",
    region: "us-east-1",
    vcpus: 12,
    capacityGb: 80,
    monthlyCost: { amount: 2_256, currency: "USD" },   // $3.09/hr
    tags: { env: "production", team: "research", workload: "AI Training", category: "gpu-compute", pricePerHour: "3.09" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },

  // ── Spheron ────────────────────────────────────────────────────────────────
  {
    id: "spheron::gpu::b200-sxm6-1x-us-east",
    kind: "GPU_INSTANCE",
    name: "Spheron — B200 SXM6 (1×)",
    vendor: "Spheron",
    region: "us-east-1",
    vcpus: 30,
    capacityGb: 192,
    monthlyCost: { amount: 4_395, currency: "USD" },   // $6.02/hr
    tags: { env: "production", team: "ml-platform", workload: "AI Training", category: "gpu-compute", pricePerHour: "6.02" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "spheron::gpu::h200-sxm-1x-us-east",
    kind: "GPU_INSTANCE",
    name: "Spheron — H200 SXM (1×)",
    vendor: "Spheron",
    region: "us-east-1",
    vcpus: 44,
    capacityGb: 141,
    monthlyCost: { amount: 3_314, currency: "USD" },   // $4.54/hr
    tags: { env: "production", team: "ml-platform", workload: "AI Training", category: "gpu-compute", pricePerHour: "4.54" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
];

const MODEL_DEPLOYMENTS: ModelDeployment[] = [
  // ---------------------------------------------------------------------------
  // Business Productivity assets — scraped from aadhunikai.com/tools?category=business-productivity
  // ---------------------------------------------------------------------------

  {
    id: "notion::productivity::notion-ai-prod",
    name: "Notion AI — Workspace Assistant",
    provider: "Notion",
    modelId: "notion-ai-v2",
    region: "us-east-1",
    endpoint: "https://notion.so",
    monthlyCost: { amount: 8_400, currency: "USD" },
    useCaseLabels: ["Knowledge Management", "Document Creation"],
    tags: { env: "production", team: "ops", category: "business-productivity", pricing: "freemium", planName: "Plus", pricePerSeat: "16", billingCycle: "monthly", seats: 525, owner: "alice@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "microsoft::productivity::copilot-prod",
    name: "Microsoft Copilot — M365 AI Assistant",
    provider: "Microsoft",
    modelId: "copilot-gpt4-turbo",
    region: "eu-west-1",
    endpoint: "https://copilot.microsoft.com",
    monthlyCost: { amount: 14_200, currency: "USD" },
    useCaseLabels: ["Workflow Automation", "Document Creation"],
    tags: { env: "production", team: "ops", category: "business-productivity", pricing: "paid", planName: "Microsoft 365 Copilot", pricePerSeat: "30", billingCycle: "monthly", seats: 473, owner: "alice@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "zapier::productivity::zapier-ai-prod",
    name: "Zapier AI — Workflow Automation",
    provider: "Zapier",
    modelId: "zapier-ai-v3",
    region: "us-east-1",
    endpoint: "https://zapier.com",
    monthlyCost: { amount: 6_700, currency: "USD" },
    useCaseLabels: ["Workflow Automation", "Process Automation"],
    tags: { env: "production", team: "ops", category: "business-productivity", pricing: "freemium", planName: "Teams", pricePerSeat: "74", billingCycle: "monthly", seats: 91, owner: "alice@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "make::productivity::make-prod",
    name: "Make — Visual Automation Platform",
    provider: "Make",
    modelId: "make-ai-v2",
    region: "eu-central-1",
    endpoint: "https://make.com",
    monthlyCost: { amount: 4_300, currency: "USD" },
    useCaseLabels: ["Workflow Automation", "Process Automation"],
    tags: { env: "production", team: "ops", category: "business-productivity", pricing: "freemium", planName: "Core", pricePerSeat: "29", billingCycle: "monthly", seats: 148, owner: "alice@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "clickup::productivity::clickup-brain-prod",
    name: "ClickUp Brain — AI Project Management",
    provider: "ClickUp",
    modelId: "clickup-brain-v1",
    region: "us-east-1",
    endpoint: "https://clickup.com",
    monthlyCost: { amount: 5_600, currency: "USD" },
    useCaseLabels: ["Project Management", "Workflow Automation"],
    tags: { env: "production", team: "ops", category: "business-productivity", pricing: "paid", planName: "Business", pricePerSeat: "14", billingCycle: "monthly", seats: 400, owner: "alice@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "airtable::productivity::airtable-ai-prod",
    name: "Airtable AI — Smart Database Workflows",
    provider: "Airtable",
    modelId: "airtable-ai-v1",
    region: "us-east-1",
    endpoint: "https://airtable.com",
    monthlyCost: { amount: 7_100, currency: "USD" },
    useCaseLabels: ["Workflow Automation", "Data Management"],
    tags: { env: "production", team: "ops", category: "business-productivity", pricing: "paid", planName: "Business", pricePerSeat: "24", billingCycle: "monthly", seats: 296, owner: "alice@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "miro::productivity::miro-ai-prod",
    name: "Miro AI — Collaborative Whiteboard",
    provider: "Miro",
    modelId: "miro-ai-v2",
    region: "eu-west-1",
    endpoint: "https://miro.com",
    monthlyCost: { amount: 4_900, currency: "USD" },
    useCaseLabels: ["Project Management", "Document Creation"],
    tags: { env: "production", team: "product", category: "business-productivity", pricing: "paid", planName: "Business", pricePerSeat: "20", billingCycle: "monthly", seats: 245, owner: "bob@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "gamma::productivity::gamma-prod",
    name: "Gamma.app — AI Presentation Creator",
    provider: "Gamma",
    modelId: "gamma-v3",
    region: "us-west-2",
    endpoint: "https://gamma.app",
    monthlyCost: { amount: 2_800, currency: "USD" },
    useCaseLabels: ["Document Creation", "Sales Enablement"],
    tags: { env: "production", team: "sales", category: "business-productivity", pricing: "freemium", planName: "Plus", pricePerSeat: "15", billingCycle: "monthly", seats: 187, owner: "bob@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "motion::productivity::motion-prod",
    name: "Motion — AI Task Scheduler",
    provider: "Motion",
    modelId: "motion-scheduler-v2",
    region: "us-east-1",
    endpoint: "https://usemotion.com",
    monthlyCost: { amount: 3_200, currency: "USD" },
    useCaseLabels: ["Project Management", "Workflow Automation"],
    tags: { env: "production", team: "ops", category: "business-productivity", pricing: "paid", planName: "Individual", pricePerSeat: "34", billingCycle: "monthly", seats: 94, owner: "alice@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "guru::productivity::guru-ai-prod",
    name: "Guru AI — Knowledge Management",
    provider: "Guru",
    modelId: "guru-ai-v2",
    region: "us-east-1",
    endpoint: "https://getguru.com",
    monthlyCost: { amount: 5_100, currency: "USD" },
    useCaseLabels: ["Knowledge Management", "Customer Support"],
    tags: { env: "production", team: "ops", category: "business-productivity", pricing: "paid", planName: "Builder", pricePerSeat: "18", billingCycle: "monthly", seats: 283, owner: "alice@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "taskade::productivity::taskade-ai-prod",
    name: "Taskade AI — Productivity & Collaboration",
    provider: "Taskade",
    modelId: "taskade-ai-v2",
    region: "us-east-1",
    endpoint: "https://taskade.com",
    monthlyCost: { amount: 2_600, currency: "USD" },
    useCaseLabels: ["Project Management", "Knowledge Management"],
    tags: { env: "production", team: "product", category: "business-productivity", pricing: "freemium", planName: "Pro", pricePerSeat: "8", billingCycle: "monthly", seats: 325, owner: "bob@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "bardeen::productivity::bardeen-prod",
    name: "Bardeen — AI Browser Automation",
    provider: "Bardeen",
    modelId: "bardeen-v2",
    region: "us-west-2",
    endpoint: "https://bardeen.ai",
    monthlyCost: { amount: 1_900, currency: "USD" },
    useCaseLabels: ["Workflow Automation", "Process Automation"],
    tags: { env: "production", team: "ops", category: "business-productivity", pricing: "freemium", planName: "Power", pricePerSeat: "40", billingCycle: "monthly", seats: 48, owner: "alice@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "mem::productivity::mem-ai-prod",
    name: "Mem AI — Smart Note-Taking",
    provider: "Mem AI",
    modelId: "mem-ai-v3",
    region: "us-east-1",
    endpoint: "https://mem.ai",
    monthlyCost: { amount: 2_100, currency: "USD" },
    useCaseLabels: ["Knowledge Management", "Document Creation"],
    tags: { env: "production", team: "product", category: "business-productivity", pricing: "paid", planName: "Teams", pricePerSeat: "14", billingCycle: "monthly", seats: 150, owner: "bob@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "genspark::productivity::genspark-prod",
    name: "Genspark — Autonomous AI Superagent",
    provider: "Genspark",
    modelId: "genspark-agent-v1",
    region: "us-east-1",
    endpoint: "https://genspark.ai",
    monthlyCost: { amount: 3_700, currency: "USD" },
    useCaseLabels: ["Workflow Automation", "Research Automation"],
    tags: { env: "production", team: "product", category: "business-productivity", pricing: "subscription", planName: "Pro", pricePerSeat: "30", billingCycle: "monthly", seats: 123, owner: "bob@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "resolveai::productivity::resolveai-prod",
    name: "ResolveAI — Custom Support Agents",
    provider: "Resolve AI",
    modelId: "resolveai-v2",
    region: "eu-west-1",
    endpoint: "https://resolveai.co",
    monthlyCost: { amount: 2_400, currency: "USD" },
    useCaseLabels: ["Customer Support", "Workflow Automation"],
    tags: { env: "production", team: "cx-ai", category: "business-productivity", pricing: "freemium", planName: "Growth", pricePerSeat: "99", billingCycle: "monthly", seats: 24, owner: "carol@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "parley::productivity::parley-ai-prod",
    name: "Parley AI — Legal Meeting Intelligence",
    provider: "Parley AI",
    modelId: "parley-legal-v1",
    region: "us-east-1",
    endpoint: "https://parleyai.com",
    monthlyCost: { amount: 4_500, currency: "USD" },
    useCaseLabels: ["Meeting Intelligence", "Document Creation"],
    tags: { env: "production", team: "legal", category: "business-productivity", pricing: "subscription", planName: "Enterprise", pricePerSeat: "99", billingCycle: "monthly", seats: 45, owner: "dave@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "copper::productivity::copper-crm-prod",
    name: "Copper CRM — Google Workspace CRM",
    provider: "Copper",
    modelId: "copper-ai-v2",
    region: "us-east-1",
    endpoint: "https://copper.com",
    monthlyCost: { amount: 6_200, currency: "USD" },
    useCaseLabels: ["Sales Automation", "Customer Support"],
    tags: { env: "production", team: "sales", category: "business-productivity", pricing: "subscription", planName: "Business", pricePerSeat: "29", billingCycle: "monthly", seats: 214, owner: "dave@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "smartclerk::productivity::smartclerk-prod",
    name: "SmartClerk — Invoice Automation",
    provider: "SmartClerk",
    modelId: "smartclerk-v1",
    region: "eu-central-1",
    endpoint: "https://smartclerk.ai",
    monthlyCost: { amount: 1_800, currency: "USD" },
    useCaseLabels: ["Process Automation", "Data Management"],
    tags: { env: "production", team: "finance", category: "business-productivity", pricing: "subscription", planName: "Growth", pricePerSeat: "49", billingCycle: "monthly", seats: 37, owner: "alice@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "springbase::productivity::springbase-prod",
    name: "Springbase — AI CRM & Sales Automation",
    provider: "Springbase",
    modelId: "springbase-v1",
    region: "us-west-2",
    endpoint: "https://springbase.ai",
    monthlyCost: { amount: 3_300, currency: "USD" },
    useCaseLabels: ["Sales Automation", "Workflow Automation"],
    tags: { env: "production", team: "sales", category: "business-productivity", pricing: "subscription", planName: "Pro", pricePerSeat: "79", billingCycle: "monthly", seats: 42, owner: "dave@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "foundersplan::productivity::foundersplan-prod",
    name: "FoundersPlan — AI Business Plan Generator",
    provider: "Founders Plan",
    modelId: "foundersplan-v1",
    region: "us-east-1",
    endpoint: "https://foundersplan.ai",
    monthlyCost: { amount: 1_500, currency: "USD" },
    useCaseLabels: ["Document Creation", "Research Automation"],
    tags: { env: "production", team: "strategy", category: "business-productivity", pricing: "subscription", planName: "Starter", pricePerSeat: "29", billingCycle: "monthly", seats: 52, owner: "bob@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "slite::productivity::slite-prod",
    name: "Slite — AI Knowledge Base",
    provider: "Slite",
    modelId: "slite-ai-v2",
    region: "eu-west-1",
    endpoint: "https://slite.com",
    monthlyCost: { amount: 2_900, currency: "USD" },
    useCaseLabels: ["Knowledge Management", "Document Creation"],
    tags: { env: "production", team: "ops", category: "business-productivity", pricing: "freemium", planName: "Standard", pricePerSeat: "12.5", billingCycle: "monthly", seats: 232, owner: "alice@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "tana::productivity::tana-ai-prod",
    name: "Tana AI — Knowledge Graph Platform",
    provider: "Tana AI",
    modelId: "tana-v2",
    region: "eu-central-1",
    endpoint: "https://tana.inc",
    monthlyCost: { amount: 2_200, currency: "USD" },
    useCaseLabels: ["Knowledge Management", "Research Automation"],
    tags: { env: "production", team: "product", category: "business-productivity", pricing: "freemium", planName: "Teams", pricePerSeat: "14", billingCycle: "monthly", seats: 157, owner: "bob@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "reuben::productivity::reuben-ai-prod",
    name: "Reuben AI — Private Capital Due Diligence",
    provider: "Reuben AI",
    modelId: "reuben-v1",
    region: "eu-west-1",
    endpoint: "https://reubenai.com",
    monthlyCost: { amount: 5_800, currency: "USD" },
    useCaseLabels: ["Research Automation", "Data Management"],
    tags: { env: "production", team: "finance", category: "business-productivity", pricing: "subscription", planName: "Enterprise", pricePerSeat: "299", billingCycle: "monthly", seats: 19, owner: "dave@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "chatronix::productivity::chatronix-prod",
    name: "Chatronix — Custom Business Chatbots",
    provider: "Chatronix",
    modelId: "chatronix-v1",
    region: "ap-southeast-1",
    endpoint: "https://chatronix.ai",
    monthlyCost: { amount: 2_000, currency: "USD" },
    useCaseLabels: ["Customer Support", "Workflow Automation"],
    tags: { env: "production", team: "cx-ai", category: "business-productivity", pricing: "freemium", planName: "Growth", pricePerSeat: "49", billingCycle: "monthly", seats: 41, owner: "carol@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
];

const IDENTITY_GRANTS: IdentityGrant[] = [];

const EGRESS_EVENTS: EgressEvent[] = [];

// ---------------------------------------------------------------------------
// MockCloudConnector
// ---------------------------------------------------------------------------

export class MockCloudConnector implements IConnector {
  readonly id = "mock-cloud-connector-v1";
  readonly name = "Mock Connector — Business Productivity AI Tools";

  async listAssets(): Promise<Asset[]> {
    return structuredClone(ASSETS);
  }

  async listModelDeployments(): Promise<ModelDeployment[]> {
    return structuredClone(MODEL_DEPLOYMENTS);
  }

  async listIdentityGrants(): Promise<IdentityGrant[]> {
    return structuredClone(IDENTITY_GRANTS);
  }

  async listEgressEvents(): Promise<EgressEvent[]> {
    return structuredClone(EGRESS_EVENTS);
  }
}
