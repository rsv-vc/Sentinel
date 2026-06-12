// Shared mock asset catalogue — 30 software + 30 hardware
// Use case labels must match the exact strings in use-cases/page.tsx mockUseCases

export const SOFTWARE_ASSETS = [
  // ── Anthropic ──────────────────────────────────────────────────────────────
  {
    id: "sw-claude-sonnet", label: "Claude 3.5 Sonnet API", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Anthropic", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 2500,
      useCaseLabels: ["Knowledge Management Assistant", "Code Review Assistant", "HR Policy Chatbot", "Workflow Automation"],
      tags: { team: "product", pricing: "paid", planName: "API" },
    },
  },
  {
    id: "sw-claude-haiku", label: "Claude 3 Haiku API", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Anthropic", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 600,
      useCaseLabels: ["Customer Support Triage", "HR Policy Chatbot"],
      tags: { team: "cx-ai", pricing: "paid", planName: "API" },
    },
  },

  // ── OpenAI ─────────────────────────────────────────────────────────────────
  {
    id: "sw-gpt4-turbo", label: "GPT-4 Turbo API", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "OpenAI", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 3200,
      useCaseLabels: ["Document Creation Copilot", "Customer Support Triage"],
      tags: { team: "sales", pricing: "paid", planName: "Enterprise" },
    },
  },
  {
    id: "sw-gpt35", label: "GPT-3.5 Turbo API", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "OpenAI", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 800,
      useCaseLabels: ["Customer Support Triage", "HR Policy Chatbot"],
      tags: { team: "cx-ai", pricing: "paid", planName: "Standard" },
    },
  },
  {
    id: "sw-dalle3", label: "DALL·E 3 API", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "OpenAI", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 420,
      useCaseLabels: ["Document Creation Copilot"],
      tags: { team: "sales", pricing: "paid", planName: "API" },
    },
  },
  {
    id: "sw-whisper", label: "Whisper API", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "OpenAI", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 350,
      useCaseLabels: ["Customer Support Triage", "Knowledge Management Assistant"],
      tags: { team: "cx-ai", pricing: "paid", planName: "API" },
    },
  },

  // ── Google Cloud ────────────────────────────────────────────────────────────
  {
    id: "sw-vertex", label: "Vertex AI (Gemini 1.5 Pro)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Google Cloud", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 1200,
      useCaseLabels: ["Financial Forecasting Model", "Data Pipeline Intelligence"],
      tags: { team: "finance", pricing: "paid", planName: "Pay-as-you-go" },
    },
  },

  // ── AWS ────────────────────────────────────────────────────────────────────
  {
    id: "sw-bedrock", label: "AWS Bedrock (Claude + Titan)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "AWS", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 1400,
      useCaseLabels: ["Financial Forecasting Model", "Data Pipeline Intelligence"],
      tags: { team: "finance", pricing: "paid", planName: "On-Demand" },
    },
  },

  // ── Microsoft ──────────────────────────────────────────────────────────────
  {
    id: "sw-github-copilot", label: "GitHub Copilot Business", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Microsoft", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 1900,
      useCaseLabels: ["Code Review Assistant"],
      tags: { team: "product", pricing: "subscription", planName: "Business", pricePerSeat: "19", seats: 100 },
    },
  },
  {
    id: "sw-azure-openai", label: "Azure OpenAI Service", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Microsoft", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 2100,
      useCaseLabels: ["Document Creation Copilot", "Knowledge Management Assistant"],
      tags: { team: "strategy", pricing: "paid", planName: "Standard" },
    },
  },
  {
    id: "sw-copilot365", label: "Microsoft 365 Copilot", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Microsoft", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 6000,
      useCaseLabels: ["Document Creation Copilot", "Workflow Automation", "Knowledge Management Assistant"],
      tags: { team: "ops", pricing: "subscription", planName: "M365 Copilot", pricePerSeat: "30", seats: 200 },
    },
  },

  // ── Notion Labs ───────────────────────────────────────────────────────────
  {
    id: "sw-notion-ai", label: "Notion AI", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "Notion Labs", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 1600,
      useCaseLabels: ["Knowledge Management Assistant", "Document Creation Copilot"],
      tags: { team: "strategy", pricing: "subscription", planName: "Business + AI", pricePerSeat: "8", seats: 200 },
    },
  },

  // ── Salesforce ─────────────────────────────────────────────────────────────
  {
    id: "sw-einstein", label: "Salesforce Einstein Copilot", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Salesforce", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 2400,
      useCaseLabels: ["Customer Support Triage", "Workflow Automation"],
      tags: { team: "sales", pricing: "subscription", planName: "Enterprise", pricePerSeat: "50", seats: 48 },
    },
  },

  // ── Intercom ───────────────────────────────────────────────────────────────
  {
    id: "sw-intercom-fin", label: "Intercom Fin AI Agent", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Intercom", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 1800,
      useCaseLabels: ["Customer Support Triage"],
      tags: { team: "cx-ai", pricing: "subscription", planName: "Advanced" },
    },
  },

  // ── Zendesk ────────────────────────────────────────────────────────────────
  {
    id: "sw-zendesk-ai", label: "Zendesk AI Agents", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Zendesk", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 1500,
      useCaseLabels: ["Customer Support Triage", "HR Policy Chatbot"],
      tags: { team: "cx-ai", pricing: "subscription", planName: "Suite Pro" },
    },
  },

  // ── Grammarly ──────────────────────────────────────────────────────────────
  {
    id: "sw-grammarly", label: "Grammarly Business", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Grammarly", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 900,
      useCaseLabels: ["Document Creation Copilot"],
      tags: { team: "sales", pricing: "subscription", planName: "Business", pricePerSeat: "12", seats: 75 },
    },
  },

  // ── Jasper ─────────────────────────────────────────────────────────────────
  {
    id: "sw-jasper", label: "Jasper AI (Content)", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "Jasper", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 1200,
      useCaseLabels: ["Document Creation Copilot"],
      tags: { team: "sales", pricing: "subscription", planName: "Business" },
    },
  },

  // ── Mistral AI ─────────────────────────────────────────────────────────────
  {
    id: "sw-mistral", label: "Mistral Large API", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Mistral AI", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 900,
      useCaseLabels: ["Code Review Assistant", "Knowledge Management Assistant"],
      tags: { team: "product", pricing: "paid", planName: "API" },
    },
  },

  // ── Cohere ─────────────────────────────────────────────────────────────────
  {
    id: "sw-cohere", label: "Cohere Embed & Rerank", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Cohere", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 600,
      useCaseLabels: ["Knowledge Management Assistant", "Data Pipeline Intelligence"],
      tags: { team: "ops", pricing: "paid", planName: "Production" },
    },
  },

  // ── Pinecone ───────────────────────────────────────────────────────────────
  {
    id: "sw-pinecone", label: "Pinecone Serverless", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Pinecone", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 500,
      useCaseLabels: ["Knowledge Management Assistant", "Data Pipeline Intelligence"],
      tags: { team: "ops", pricing: "subscription", planName: "Standard" },
    },
  },

  // ── Weaviate ───────────────────────────────────────────────────────────────
  {
    id: "sw-weaviate", label: "Weaviate Cloud", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "Weaviate", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 700,
      useCaseLabels: ["Knowledge Management Assistant", "Data Pipeline Intelligence"],
      tags: { team: "ops", pricing: "subscription", planName: "Standard" },
    },
  },

  // ── LangChain ──────────────────────────────────────────────────────────────
  {
    id: "sw-langchain", label: "LangChain Cloud (LangSmith)", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "LangChain", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 200,
      useCaseLabels: ["Workflow Automation", "Document Creation Copilot"],
      tags: { team: "product", pricing: "subscription", planName: "Plus" },
    },
  },

  // ── Hugging Face ───────────────────────────────────────────────────────────
  {
    id: "sw-hf-inference", label: "HF Inference Endpoints", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "Hugging Face", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 400,
      useCaseLabels: ["Data Pipeline Intelligence", "Workflow Automation"],
      tags: { team: "ops", pricing: "freemium", planName: "Pro" },
    },
  },

  // ── Together AI ────────────────────────────────────────────────────────────
  {
    id: "sw-together", label: "Together AI Inference", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "Together AI", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 750,
      useCaseLabels: ["Workflow Automation", "Data Pipeline Intelligence"],
      tags: { team: "product", pricing: "paid", planName: "API" },
    },
  },

  // ── Databricks ─────────────────────────────────────────────────────────────
  {
    id: "sw-databricks", label: "Databricks AI (DBRX)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Databricks", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 3500,
      useCaseLabels: ["Financial Forecasting Model", "Data Pipeline Intelligence"],
      tags: { team: "finance", pricing: "paid", planName: "Enterprise" },
    },
  },

  // ── Snowflake ──────────────────────────────────────────────────────────────
  {
    id: "sw-snowflake", label: "Snowflake Cortex AI", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Snowflake", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 1100,
      useCaseLabels: ["Financial Forecasting Model", "Data Pipeline Intelligence"],
      tags: { team: "finance", pricing: "paid", planName: "Enterprise" },
    },
  },

  // ── Scale AI ───────────────────────────────────────────────────────────────
  {
    id: "sw-scale", label: "Scale AI Data Engine", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "Scale AI", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 2000,
      useCaseLabels: ["Data Pipeline Intelligence"],
      tags: { team: "ops", pricing: "paid", planName: "Growth" },
    },
  },

  // ── Weights & Biases ───────────────────────────────────────────────────────
  {
    id: "sw-wandb", label: "Weights & Biases (W&B)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Weights & Biases", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 400,
      useCaseLabels: ["Data Pipeline Intelligence", "Workflow Automation"],
      tags: { team: "product", pricing: "subscription", planName: "Teams" },
    },
  },

  // ── ElevenLabs ─────────────────────────────────────────────────────────────
  {
    id: "sw-elevenlabs", label: "ElevenLabs Voice AI", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "ElevenLabs", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 330,
      useCaseLabels: ["Customer Support Triage"],
      tags: { team: "cx-ai", pricing: "subscription", planName: "Business" },
    },
  },

  // ── Deepgram ───────────────────────────────────────────────────────────────
  {
    id: "sw-deepgram", label: "Deepgram Nova-2 STT", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Deepgram", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 450,
      useCaseLabels: ["Customer Support Triage", "Data Pipeline Intelligence"],
      tags: { team: "cx-ai", pricing: "paid", planName: "Growth" },
    },
  },

  // ── Glean ──────────────────────────────────────────────────────────────────
  {
    id: "sw-glean", label: "Glean Enterprise Search AI", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Glean", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 2800,
      useCaseLabels: ["Knowledge Management Assistant"],
      tags: { team: "ops", pricing: "subscription", planName: "Enterprise" },
    },
  },

  // ── Workato ────────────────────────────────────────────────────────────────
  {
    id: "sw-workato", label: "Workato AI Copilot", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "Workato", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 1600,
      useCaseLabels: ["Workflow Automation"],
      tags: { team: "ops", pricing: "subscription", planName: "Business" },
    },
  },

  // ── Workday ────────────────────────────────────────────────────────────────
  {
    id: "sw-workday-ai", label: "Workday AI (HCM Assist)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Workday", kind: "MODEL_DEPLOYMENT", monthlyCostUsd: 2000,
      useCaseLabels: ["HR Policy Chatbot", "Workflow Automation"],
      tags: { team: "legal", pricing: "subscription", planName: "Enterprise" },
    },
  },
];

export const HARDWARE_ASSETS = [
  // ── AWS ────────────────────────────────────────────────────────────────────
  {
    id: "hw-p3-16", label: "AWS p3.16xlarge (V100 ×8)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "AWS", kind: "HARDWARE", monthlyCostUsd: 8500,
      vcpus: 64, capacityGb: 128, region: "us-east-1",
      tags: { team: "ops", pricePerHour: "11.41", workload: "Model Training" },
    },
  },
  {
    id: "hw-p4d-24", label: "AWS p4d.24xlarge (A100 ×8)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "AWS", kind: "HARDWARE", monthlyCostUsd: 22000,
      vcpus: 96, capacityGb: 320, region: "us-east-1",
      tags: { team: "ops", pricePerHour: "29.46", workload: "Large-Scale Training" },
    },
  },
  {
    id: "hw-g5-12", label: "AWS g5.12xlarge (A10G ×4)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "AWS", kind: "HARDWARE", monthlyCostUsd: 3200,
      vcpus: 48, capacityGb: 96, region: "us-east-1",
      tags: { team: "ops", pricePerHour: "4.10", workload: "Inference" },
    },
  },
  {
    id: "hw-g4dn-12", label: "AWS g4dn.12xlarge (T4 ×4)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "AWS", kind: "HARDWARE", monthlyCostUsd: 2600,
      vcpus: 48, capacityGb: 64, region: "us-east-1",
      tags: { team: "ops", pricePerHour: "3.91", workload: "Inference" },
    },
  },
  {
    id: "hw-trainium2", label: "AWS Trainium2 (trn2.48xlarge)", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "AWS", kind: "HARDWARE", monthlyCostUsd: 5500,
      vcpus: 192, capacityGb: 512, region: "us-east-1",
      tags: { team: "product", pricePerHour: "7.35", workload: "Custom LLM Training" },
    },
  },
  {
    id: "hw-inferentia2", label: "AWS Inferentia2 (inf2.24xlarge)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "AWS", kind: "HARDWARE", monthlyCostUsd: 2800,
      vcpus: 96, capacityGb: 384, region: "us-west-2",
      tags: { team: "ops", pricePerHour: "3.84", workload: "Optimised Inference" },
    },
  },

  // ── Google Cloud ────────────────────────────────────────────────────────────
  {
    id: "hw-gcp-a100-80", label: "GCP A100 80 GB ×8 (a2-ultragpu)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Google Cloud", kind: "HARDWARE", monthlyCostUsd: 18000,
      vcpus: 96, capacityGb: 640, region: "us-central1",
      tags: { team: "ops", pricePerHour: "24.50", workload: "Foundation Model Training" },
    },
  },
  {
    id: "hw-gcp-v100", label: "GCP V100 16 GB ×8 (n1-standard-96)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Google Cloud", kind: "HARDWARE", monthlyCostUsd: 7200,
      vcpus: 64, capacityGb: 128, region: "us-central1",
      tags: { team: "ops", pricePerHour: "9.76", workload: "ML Training" },
    },
  },
  {
    id: "hw-gcp-t4", label: "GCP T4 16 GB ×4 (n1-standard-48)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Google Cloud", kind: "HARDWARE", monthlyCostUsd: 1800,
      vcpus: 48, capacityGb: 64, region: "us-central1",
      tags: { team: "product", pricePerHour: "2.45", workload: "Serving" },
    },
  },
  {
    id: "hw-gcp-l4", label: "GCP L4 24 GB ×8 (g2-standard-96)", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "Google Cloud", kind: "HARDWARE", monthlyCostUsd: 4800,
      vcpus: 96, capacityGb: 192, region: "europe-west4",
      tags: { team: "product", pricePerHour: "6.46", workload: "Batch Inference" },
    },
  },

  // ── Microsoft Azure ─────────────────────────────────────────────────────────
  {
    id: "hw-az-nd96", label: "Azure ND96amsr A100 v4 (×8)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Microsoft Azure", kind: "HARDWARE", monthlyCostUsd: 32000,
      vcpus: 96, capacityGb: 320, region: "eastus",
      tags: { team: "finance", pricePerHour: "43.10", workload: "Distributed Training" },
    },
  },
  {
    id: "hw-az-nc24", label: "Azure NC24ads A100 v4 (×1)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Microsoft Azure", kind: "HARDWARE", monthlyCostUsd: 6200,
      vcpus: 24, capacityGb: 80, region: "eastus",
      tags: { team: "finance", pricePerHour: "8.26", workload: "Single-GPU Workloads" },
    },
  },
  {
    id: "hw-az-nv36", label: "Azure NV36ads A10 v5 (×1)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Microsoft Azure", kind: "HARDWARE", monthlyCostUsd: 3800,
      vcpus: 36, capacityGb: 24, region: "eastus",
      tags: { team: "finance", pricePerHour: "5.10", workload: "Inference & Visualisation" },
    },
  },

  // ── Lambda Labs ─────────────────────────────────────────────────────────────
  {
    id: "hw-lambda-h100", label: "Lambda Labs H100 SXM5 ×8", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Lambda Labs", kind: "HARDWARE", monthlyCostUsd: 24000,
      vcpus: 128, capacityGb: 640, region: "us-west-2",
      tags: { team: "product", pricePerHour: "32.39", workload: "Next-Gen LLM Training" },
    },
  },
  {
    id: "hw-lambda-a100-80", label: "Lambda Labs A100 80 GB ×8", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Lambda Labs", kind: "HARDWARE", monthlyCostUsd: 14400,
      vcpus: 96, capacityGb: 640, region: "us-west-1",
      tags: { team: "product", pricePerHour: "19.44", workload: "LLM Fine-tuning" },
    },
  },
  {
    id: "hw-lambda-a10", label: "Lambda Labs A10 24 GB ×1", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Lambda Labs", kind: "HARDWARE", monthlyCostUsd: 2400,
      vcpus: 30, capacityGb: 24, region: "us-west-1",
      tags: { team: "product", pricePerHour: "3.16", workload: "Model Serving" },
    },
  },

  // ── CoreWeave ──────────────────────────────────────────────────────────────
  {
    id: "hw-cw-h100", label: "CoreWeave H100 SXM5 ×8", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "CoreWeave", kind: "HARDWARE", monthlyCostUsd: 28000,
      vcpus: 128, capacityGb: 640, region: "US-NY-1",
      tags: { team: "ops", pricePerHour: "38.00", workload: "Frontier Model Training" },
    },
  },
  {
    id: "hw-cw-a100", label: "CoreWeave A100 PCIe ×8", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "CoreWeave", kind: "HARDWARE", monthlyCostUsd: 14800,
      vcpus: 96, capacityGb: 640, region: "US-NY-1",
      tags: { team: "ops", pricePerHour: "20.00", workload: "Large Batch Inference" },
    },
  },
  {
    id: "hw-cw-rtxa6000", label: "CoreWeave RTX A6000 ×8", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "CoreWeave", kind: "HARDWARE", monthlyCostUsd: 4800,
      vcpus: 64, capacityGb: 384, region: "US-NY-1",
      tags: { team: "ops", pricePerHour: "6.45", workload: "Research Workloads" },
    },
  },

  // ── RunPod ─────────────────────────────────────────────────────────────────
  {
    id: "hw-runpod-h100", label: "RunPod H100 NVL ×8", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "RunPod", kind: "HARDWARE", monthlyCostUsd: 16000,
      vcpus: 128, capacityGb: 188, region: "US-TX",
      tags: { team: "ops", pricePerHour: "21.52", workload: "High-Memory Training" },
    },
  },
  {
    id: "hw-runpod-a100", label: "RunPod A100 SXM4 80 GB ×8", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "RunPod", kind: "HARDWARE", monthlyCostUsd: 9500,
      vcpus: 96, capacityGb: 640, region: "US-TX",
      tags: { team: "ops", pricePerHour: "12.80", workload: "Fine-tuning" },
    },
  },
  {
    id: "hw-runpod-4090", label: "RunPod RTX 4090 ×8", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "RunPod", kind: "HARDWARE", monthlyCostUsd: 2400,
      vcpus: 64, capacityGb: 192, region: "US-TX",
      tags: { team: "product", pricePerHour: "3.22", workload: "Consumer-Grade Fine-tuning" },
    },
  },

  // ── Paperspace ─────────────────────────────────────────────────────────────
  {
    id: "hw-ps-a100", label: "Paperspace A100 80 GB ×8", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Paperspace", kind: "HARDWARE", monthlyCostUsd: 7800,
      vcpus: 48, capacityGb: 640, region: "East",
      tags: { team: "product", pricePerHour: "10.55", workload: "R&D" },
    },
  },
  {
    id: "hw-ps-a6000", label: "Paperspace RTX A6000 ×1", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "Paperspace", kind: "HARDWARE", monthlyCostUsd: 2000,
      vcpus: 10, capacityGb: 48, region: "East",
      tags: { team: "product", pricePerHour: "2.69", workload: "Small-Scale Training" },
    },
  },

  // ── Vast.ai ────────────────────────────────────────────────────────────────
  {
    id: "hw-vast-a100", label: "Vast.ai A100 80 GB ×8 (Spot)", nodeType: "ASSET", confidence: "LOW",
    attributes: {
      vendor: "Vast.ai", kind: "HARDWARE", monthlyCostUsd: 6500,
      vcpus: 64, capacityGb: 640, region: "US-Spot",
      tags: { team: "ops", pricePerHour: "8.80", workload: "Cost-Efficient Training" },
    },
  },
  {
    id: "hw-vast-3090", label: "Vast.ai RTX 3090 ×4 (Spot)", nodeType: "ASSET", confidence: "LOW",
    attributes: {
      vendor: "Vast.ai", kind: "HARDWARE", monthlyCostUsd: 1200,
      vcpus: 32, capacityGb: 96, region: "Global-Spot",
      tags: { team: "ops", pricePerHour: "1.60", workload: "Research / Hobbyist" },
    },
  },

  // ── Oracle Cloud ───────────────────────────────────────────────────────────
  {
    id: "hw-oci-a100", label: "Oracle GPU A100 ×1 (BM.GPU.A100-v2)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Oracle Cloud", kind: "HARDWARE", monthlyCostUsd: 9800,
      vcpus: 64, capacityGb: 80, region: "us-ashburn-1",
      tags: { team: "finance", pricePerHour: "13.17", workload: "Enterprise GPU" },
    },
  },
  {
    id: "hw-oci-a10", label: "Oracle GPU A10 ×4 (VM.GPU.A10)", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Oracle Cloud", kind: "HARDWARE", monthlyCostUsd: 2200,
      vcpus: 60, capacityGb: 96, region: "eu-frankfurt-1",
      tags: { team: "finance", pricePerHour: "2.95", workload: "Inference" },
    },
  },

  // ── Modal ──────────────────────────────────────────────────────────────────
  {
    id: "hw-modal-h100", label: "Modal H100 Serverless ×8", nodeType: "ASSET", confidence: "HIGH",
    attributes: {
      vendor: "Modal", kind: "HARDWARE", monthlyCostUsd: 12000,
      vcpus: 128, capacityGb: 640, region: "US-Managed",
      tags: { team: "product", pricePerHour: "4.00", workload: "Serverless ML" },
    },
  },

  // ── IBM Cloud ──────────────────────────────────────────────────────────────
  {
    id: "hw-ibm-v100", label: "IBM Cloud V100 ×2 (GPU Compute)", nodeType: "ASSET", confidence: "MEDIUM",
    attributes: {
      vendor: "IBM Cloud", kind: "HARDWARE", monthlyCostUsd: 4500,
      vcpus: 40, capacityGb: 32, region: "us-south",
      tags: { team: "ops", pricePerHour: "6.03", workload: "Deep Learning" },
    },
  },
];

export const ALL_MOCK_ASSETS = [...SOFTWARE_ASSETS, ...HARDWARE_ASSETS];

export const ALL_MOCK_VENDORS = [
  { id: "v-anthropic",   label: "Anthropic",       nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-openai",      label: "OpenAI",           nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-google",      label: "Google Cloud",     nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-aws",         label: "AWS",              nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-microsoft",   label: "Microsoft",        nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-azure",       label: "Microsoft Azure",  nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-notion",      label: "Notion Labs",      nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-salesforce",  label: "Salesforce",       nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-intercom",    label: "Intercom",         nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-zendesk",     label: "Zendesk",          nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-grammarly",   label: "Grammarly",        nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-jasper",      label: "Jasper",           nodeType: "VENDOR", confidence: "MEDIUM", attributes: {} },
  { id: "v-mistral",     label: "Mistral AI",       nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-cohere",      label: "Cohere",           nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-pinecone",    label: "Pinecone",         nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-weaviate",    label: "Weaviate",         nodeType: "VENDOR", confidence: "MEDIUM", attributes: {} },
  { id: "v-langchain",   label: "LangChain",        nodeType: "VENDOR", confidence: "MEDIUM", attributes: {} },
  { id: "v-huggingface", label: "Hugging Face",     nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-together",    label: "Together AI",      nodeType: "VENDOR", confidence: "MEDIUM", attributes: {} },
  { id: "v-databricks",  label: "Databricks",       nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-snowflake",   label: "Snowflake",        nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-scale",       label: "Scale AI",         nodeType: "VENDOR", confidence: "MEDIUM", attributes: {} },
  { id: "v-wandb",       label: "Weights & Biases", nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-elevenlabs",  label: "ElevenLabs",       nodeType: "VENDOR", confidence: "MEDIUM", attributes: {} },
  { id: "v-deepgram",    label: "Deepgram",         nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-glean",       label: "Glean",            nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-workato",     label: "Workato",          nodeType: "VENDOR", confidence: "MEDIUM", attributes: {} },
  { id: "v-workday",     label: "Workday",          nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-lambda",      label: "Lambda Labs",      nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-coreweave",   label: "CoreWeave",        nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-runpod",      label: "RunPod",           nodeType: "VENDOR", confidence: "MEDIUM", attributes: {} },
  { id: "v-paperspace",  label: "Paperspace",       nodeType: "VENDOR", confidence: "MEDIUM", attributes: {} },
  { id: "v-vast",        label: "Vast.ai",          nodeType: "VENDOR", confidence: "LOW", attributes: {} },
  { id: "v-oracle",      label: "Oracle Cloud",     nodeType: "VENDOR", confidence: "HIGH", attributes: {} },
  { id: "v-modal",       label: "Modal",            nodeType: "VENDOR", confidence: "MEDIUM", attributes: {} },
  { id: "v-ibm",         label: "IBM Cloud",        nodeType: "VENDOR", confidence: "MEDIUM", attributes: {} },
];
