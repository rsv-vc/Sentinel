/**
 * Sentinel — Connector domain types & IConnector interface.
 *
 * PRINCIPLE 4 (Read-only, least-privilege):
 *   IConnector exposes ONLY list/read methods.
 *   There are no create / update / delete / write / put / patch / post methods.
 *   This is a structural constraint — not a runtime flag or permission setting.
 *   Enforced by connector-readonly.test.ts.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type Region =
  | "us-east-1"
  | "us-west-2"
  | "eu-west-1"
  | "eu-central-1"
  | "ap-southeast-1"
  | "ap-northeast-1";

export interface MonthlyCost {
  amount: number;
  currency: "USD";
}

// ---------------------------------------------------------------------------
// Asset  (compute, GPU, storage)
// ---------------------------------------------------------------------------

export type AssetKind =
  | "GPU_INSTANCE"
  | "COMPUTE_INSTANCE"
  | "OBJECT_STORAGE"
  | "BLOCK_STORAGE";

export interface Asset {
  /** Stable, vendor-scoped identifier  e.g. "aws::i-0abc123" */
  id: string;
  kind: AssetKind;
  name: string;
  /** Cloud/on-prem vendor  e.g. "aws", "azure", "gcp" */
  vendor: string;
  region: Region;
  /** vCPU count (compute/GPU instances) */
  vcpus?: number;
  /** GPU VRAM in GB (GPU instances) or capacity in GB (storage) */
  capacityGb?: number;
  monthlyCost: MonthlyCost;
  tags: Record<string, string>;
  observedAt: Date;
}

// ---------------------------------------------------------------------------
// ModelDeployment
// ---------------------------------------------------------------------------

export type ModelProvider = "openai" | "anthropic" | "cohere" | "mistral" | "self-hosted";

export interface ModelDeployment {
  id: string;
  name: string;
  provider: ModelProvider;
  /** Base model identifier, e.g. "gpt-4o", "claude-3-5-sonnet" */
  modelId: string;
  region: Region;
  /** Endpoint URI if applicable */
  endpoint?: string;
  /** Observed monthly spend */
  monthlyCost: MonthlyCost;
  /** Use-case labels attached by the deploying team */
  useCaseLabels: string[];
  tags: Record<string, string>;
  observedAt: Date;
}

// ---------------------------------------------------------------------------
// IdentityGrant
// ---------------------------------------------------------------------------

export type GrantLevel = "read" | "write" | "admin" | "owner";

export interface IdentityGrant {
  id: string;
  /** Human or service identity (email / service-account name) */
  principal: string;
  principalKind: "human" | "service_account" | "group";
  /** Resource the grant applies to */
  resourceId: string;
  resourceKind: "asset" | "model_deployment" | "data_asset";
  grantLevel: GrantLevel;
  /** Whether the grant was observed via automated telemetry or manually recorded */
  source: "telemetry" | "manual";
  observedAt: Date;
}

// ---------------------------------------------------------------------------
// EgressEvent
// ---------------------------------------------------------------------------

export type EgressDirection = "internal" | "external" | "cross_region" | "cross_border";

export interface EgressEvent {
  id: string;
  /** Source asset/model that produced the egress */
  sourceId: string;
  /** Destination  e.g. an S3 bucket ARN, an external API host */
  destination: string;
  direction: EgressDirection;
  /** Approximate bytes transferred */
  bytes: number;
  /** Jurisdiction of the destination  e.g. "EU", "US", "IN" */
  destinationJurisdiction: string;
  observedAt: Date;
}

// ---------------------------------------------------------------------------
// IConnector — READ-ONLY interface (Principle 4)
// ---------------------------------------------------------------------------

/**
 * Every Sentinel connector MUST implement this interface.
 *
 * Rules:
 *  - All methods are async list/read operations returning typed arrays.
 *  - No method may create, modify, or delete data in the connected system.
 *  - Adding a write method here is a breaking violation of Principle 4 and
 *    will be caught by connector-readonly.test.ts.
 */
export interface IConnector {
  /** Unique stable identifier for this connector instance */
  readonly id: string;
  /** Human-readable label */
  readonly name: string;

  /** List all observed compute, GPU, and storage assets */
  listAssets(): Promise<Asset[]>;

  /** List all observed model deployments */
  listModelDeployments(): Promise<ModelDeployment[]>;

  /** List all identity grants observed on assets and model deployments */
  listIdentityGrants(): Promise<IdentityGrant[]>;

  /** List recent data-egress events */
  listEgressEvents(): Promise<EgressEvent[]>;
}

// ---------------------------------------------------------------------------
// ConnectorRegistry types
// ---------------------------------------------------------------------------

export type ConnectorStatus = "idle" | "syncing" | "error" | "never_synced";

export interface ConnectorRecord {
  connector: IConnector;
  /** Scopes/permissions declared at registration time */
  scope: string[];
  status: ConnectorStatus;
  lastSyncAt: Date | null;
  lastError: string | null;
}
