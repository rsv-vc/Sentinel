/**
 * MockCloudConnector — deterministic, realistic fake cloud estate.
 *
 * Returns the same data on every call (seeded constants, not Math.random()).
 * Designed to be a stand-in for a real AWS/Azure/GCP connector during local
 * development and demos. Real connectors will implement IConnector and pass
 * the same read-only tests.
 *
 * Estate modelled:
 *   Assets         — 2 GPU instances, 1 compute instance, 2 storage buckets
 *   Models         — 2 deployments (GPT-4o via OpenAI, Claude 3.5 Sonnet via Anthropic)
 *   Identity grants — 6 grants across humans and service accounts
 *   Egress events  — 8 recent events covering internal, external, and cross-border flows
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

const ASSETS: Asset[] = [
  {
    id: "aws::ec2::i-0a1b2c3d4e5f60001",
    kind: "GPU_INSTANCE",
    name: "ml-training-gpu-01",
    vendor: "aws",
    region: "us-east-1",
    vcpus: 96,
    capacityGb: 320, // A100 80 GB × 4
    monthlyCost: { amount: 18_432, currency: "USD" },
    tags: { env: "production", team: "ml-platform", project: "fraud-detection" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "aws::ec2::i-0a1b2c3d4e5f60002",
    kind: "GPU_INSTANCE",
    name: "ml-inference-gpu-01",
    vendor: "aws",
    region: "eu-west-1",
    vcpus: 48,
    capacityGb: 80, // A10G 24 GB × ~3
    monthlyCost: { amount: 6_144, currency: "USD" },
    tags: { env: "production", team: "ml-platform", project: "customer-churn" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "aws::ec2::i-0a1b2c3d4e5f60003",
    kind: "COMPUTE_INSTANCE",
    name: "api-worker-01",
    vendor: "aws",
    region: "us-east-1",
    vcpus: 16,
    monthlyCost: { amount: 512, currency: "USD" },
    tags: { env: "production", team: "platform", project: "api-gateway" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "aws::s3::arn:aws:s3:::sentinel-training-data",
    kind: "OBJECT_STORAGE",
    name: "sentinel-training-data",
    vendor: "aws",
    region: "us-east-1",
    capacityGb: 48_000,
    monthlyCost: { amount: 1_104, currency: "USD" },
    tags: { env: "production", classification: "confidential", team: "ml-platform" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "aws::s3::arn:aws:s3:::sentinel-model-artefacts",
    kind: "OBJECT_STORAGE",
    name: "sentinel-model-artefacts",
    vendor: "aws",
    region: "eu-west-1",
    capacityGb: 8_200,
    monthlyCost: { amount: 189, currency: "USD" },
    tags: { env: "production", classification: "internal", team: "ml-platform" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
];

const MODEL_DEPLOYMENTS: ModelDeployment[] = [
  {
    id: "openai::deployment::fraud-gpt4o-prod",
    name: "Fraud Detection — GPT-4o",
    provider: "openai",
    modelId: "gpt-4o",
    region: "us-east-1",
    endpoint: "https://api.openai.com/v1/chat/completions",
    monthlyCost: { amount: 22_400, currency: "USD" },
    useCaseLabels: ["fraud-detection", "transaction-scoring"],
    tags: { env: "production", team: "risk-ai", owner: "alice@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
  {
    id: "anthropic::deployment::churn-claude35-prod",
    name: "Customer Churn — Claude 3.5 Sonnet",
    provider: "anthropic",
    modelId: "claude-3-5-sonnet-20241022",
    region: "eu-west-1",
    endpoint: "https://api.anthropic.com/v1/messages",
    monthlyCost: { amount: 9_800, currency: "USD" },
    useCaseLabels: ["customer-churn", "retention-scoring"],
    tags: { env: "production", team: "cx-ai", owner: "bob@acme.com" },
    observedAt: new Date("2026-06-01T06:00:00Z"),
  },
];

const IDENTITY_GRANTS: IdentityGrant[] = [
  {
    id: "grant-001",
    principal: "alice@acme.com",
    principalKind: "human",
    resourceId: "aws::ec2::i-0a1b2c3d4e5f60001",
    resourceKind: "asset",
    grantLevel: "admin",
    source: "telemetry",
    observedAt: new Date("2026-05-15T09:00:00Z"),
  },
  {
    id: "grant-002",
    principal: "svc-ml-pipeline@acme-prod.iam.gserviceaccount.com",
    principalKind: "service_account",
    resourceId: "aws::s3::arn:aws:s3:::sentinel-training-data",
    resourceKind: "asset",
    grantLevel: "write",
    source: "telemetry",
    observedAt: new Date("2026-05-15T09:00:00Z"),
  },
  {
    id: "grant-003",
    principal: "bob@acme.com",
    principalKind: "human",
    resourceId: "anthropic::deployment::churn-claude35-prod",
    resourceKind: "model_deployment",
    grantLevel: "read",
    source: "telemetry",
    observedAt: new Date("2026-05-20T11:00:00Z"),
  },
  {
    id: "grant-004",
    principal: "ml-engineers@acme.com",
    principalKind: "group",
    resourceId: "aws::ec2::i-0a1b2c3d4e5f60002",
    resourceKind: "asset",
    grantLevel: "admin",
    source: "telemetry",
    observedAt: new Date("2026-05-20T11:00:00Z"),
  },
  {
    id: "grant-005",
    principal: "svc-fraud-scorer@acme-prod.iam.gserviceaccount.com",
    principalKind: "service_account",
    resourceId: "openai::deployment::fraud-gpt4o-prod",
    resourceKind: "model_deployment",
    grantLevel: "write",
    source: "telemetry",
    observedAt: new Date("2026-05-28T14:00:00Z"),
  },
  {
    id: "grant-006",
    // Overly broad — will trigger a risk flag in Phase 5
    principal: "contractors@acme.com",
    principalKind: "group",
    resourceId: "aws::s3::arn:aws:s3:::sentinel-training-data",
    resourceKind: "asset",
    grantLevel: "read",
    source: "manual",
    observedAt: new Date("2026-05-30T16:00:00Z"),
  },
];

const EGRESS_EVENTS: EgressEvent[] = [
  {
    id: "egress-001",
    sourceId: "aws::ec2::i-0a1b2c3d4e5f60001",
    destination: "s3://sentinel-model-artefacts",
    direction: "internal",
    bytes: 4_300_000_000,
    destinationJurisdiction: "US",
    observedAt: new Date("2026-06-01T02:00:00Z"),
  },
  {
    id: "egress-002",
    sourceId: "openai::deployment::fraud-gpt4o-prod",
    destination: "https://api.openai.com",
    direction: "external",
    bytes: 820_000,
    destinationJurisdiction: "US",
    observedAt: new Date("2026-06-01T03:15:00Z"),
  },
  {
    id: "egress-003",
    sourceId: "anthropic::deployment::churn-claude35-prod",
    destination: "https://api.anthropic.com",
    direction: "external",
    bytes: 430_000,
    destinationJurisdiction: "US",
    observedAt: new Date("2026-06-01T03:20:00Z"),
  },
  {
    id: "egress-004",
    // EU model hitting a US endpoint — potential GDPR residency flag (Phase 5)
    sourceId: "aws::ec2::i-0a1b2c3d4e5f60002",
    destination: "https://api.openai.com",
    direction: "cross_border",
    bytes: 120_000,
    destinationJurisdiction: "US",
    observedAt: new Date("2026-06-01T04:00:00Z"),
  },
  {
    id: "egress-005",
    sourceId: "aws::s3::arn:aws:s3:::sentinel-training-data",
    destination: "s3://acme-data-lake-us-east-1",
    direction: "internal",
    bytes: 9_800_000_000,
    destinationJurisdiction: "US",
    observedAt: new Date("2026-06-01T01:00:00Z"),
  },
  {
    id: "egress-006",
    sourceId: "aws::ec2::i-0a1b2c3d4e5f60003",
    destination: "https://hooks.slack.com",
    direction: "external",
    bytes: 14_000,
    destinationJurisdiction: "US",
    observedAt: new Date("2026-06-01T05:00:00Z"),
  },
  {
    id: "egress-007",
    sourceId: "aws::s3::arn:aws:s3:::sentinel-model-artefacts",
    destination: "https://partner-api.eu-clearing.com",
    direction: "cross_region",
    bytes: 52_000_000,
    destinationJurisdiction: "EU",
    observedAt: new Date("2026-06-01T05:30:00Z"),
  },
  {
    id: "egress-008",
    // Unexpected external destination — shadow egress, will surface in Phase 4
    sourceId: "aws::ec2::i-0a1b2c3d4e5f60003",
    destination: "https://unknown-analytics.io",
    direction: "external",
    bytes: 88_000,
    destinationJurisdiction: "US",
    observedAt: new Date("2026-06-01T05:45:00Z"),
  },
];

// ---------------------------------------------------------------------------
// MockCloudConnector
// ---------------------------------------------------------------------------

export class MockCloudConnector implements IConnector {
  readonly id = "mock-cloud-connector-v1";
  readonly name = "Mock Cloud Connector (AWS/OpenAI/Anthropic)";

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
