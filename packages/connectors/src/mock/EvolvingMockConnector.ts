/**
 * EvolvingMockConnector — simulates a live cloud estate that changes over time.
 *
 * Each call to list* methods returns data that evolves based on an internal
 * sync counter. This makes change visible in the UI without needing real
 * cloud credentials.
 *
 * Evolution schedule:
 *   Run 1-2  : Baseline estate (same as MockCloudConnector)
 *   Run 3+   : Shadow asset appears (untagged GPU — low confidence candidate)
 *   Run 4+   : GPU costs drift ±5% each run (simulates spot price changes)
 *   Run 5+   : Suspicious new egress destination appears
 *   Run 7+   : Second shadow use-case inferred from a new model deployment
 *   Every run: Minor cost variance on model deployments
 *
 * The connector is deterministic given the same syncCount — running it twice
 * at the same count produces identical output.
 */

import type {
  Asset,
  EgressEvent,
  IConnector,
  IdentityGrant,
  ModelDeployment,
} from "../types";
import { MockCloudConnector } from "./MockCloudConnector";

const BASE = new MockCloudConnector();

// Small deterministic drift: varies cost by ±pct each run
function drift(base: number, pct: number, run: number): number {
  // Uses a simple sine wave so the value oscillates predictably
  const factor = 1 + (pct / 100) * Math.sin(run * 1.3);
  return Math.round(base * factor);
}

export class EvolvingMockConnector implements IConnector {
  readonly id = "evolving-mock-connector-v1";
  readonly name = "Evolving Mock Connector (simulated live estate)";

  private syncCount = 0;

  /** Called by the scheduler before each sync so the connector knows which run it's on */
  tick(): void {
    this.syncCount++;
  }

  get currentRun(): number {
    return this.syncCount;
  }

  async listAssets(): Promise<Asset[]> {
    const base = await BASE.listAssets();
    const run = this.syncCount;

    // Apply cost drift to GPU instances from run 4 onward
    const assets = base.map((a) => {
      if (a.kind === "GPU_INSTANCE" && run >= 4) {
        return {
          ...a,
          monthlyCost: {
            ...a.monthlyCost,
            amount: drift(a.monthlyCost.amount, 5, run),
          },
        };
      }
      return { ...a };
    });

    // Run 3+: shadow asset appears — untagged, no project tag → LOW confidence
    if (run >= 3) {
      assets.push({
        id: "aws::ec2::i-shadow-0xdeadbeef",
        kind: "GPU_INSTANCE",
        name: "unknown-gpu-worker",
        vendor: "aws",
        region: "us-east-1",
        vcpus: 32,
        capacityGb: 40,
        monthlyCost: { amount: drift(3200, 8, run), currency: "USD" },
        tags: {},   // intentionally untagged — will surface as shadow AI
        observedAt: new Date(),
      });
    }

    // Run 7+: another new asset linked to a new use case
    if (run >= 7) {
      assets.push({
        id: "azure::vm::sentinel-aml-worker-01",
        kind: "COMPUTE_INSTANCE",
        name: "aml-risk-worker-01",
        vendor: "azure",
        region: "eu-west-1",
        vcpus: 8,
        monthlyCost: { amount: 480, currency: "USD" },
        tags: { env: "production", team: "aml-ai", project: "aml-transaction-screening" },
        observedAt: new Date(),
      });
    }

    return assets;
  }

  async listModelDeployments(): Promise<ModelDeployment[]> {
    const base = await BASE.listModelDeployments();
    const run = this.syncCount;

    // Apply minor cost variance each run
    const models = base.map((m) => ({
      ...m,
      monthlyCost: {
        ...m.monthlyCost,
        amount: drift(m.monthlyCost.amount, 3, run),
      },
    }));

    // Run 7+: new model deployment for AML use-case
    if (run >= 7) {
      models.push({
        id: "openai::deployment::aml-gpt4o-prod",
        name: "AML Transaction Screening — GPT-4o",
        provider: "openai",
        modelId: "gpt-4o",
        region: "eu-west-1",
        endpoint: "https://api.openai.com/v1/chat/completions",
        monthlyCost: { amount: drift(14_200, 3, run), currency: "USD" },
        useCaseLabels: ["aml-transaction-screening"],
        tags: { env: "production", team: "aml-ai", owner: "carol@acme.com" },
        observedAt: new Date(),
      });
    }

    return models;
  }

  async listIdentityGrants(): Promise<IdentityGrant[]> {
    const base = await BASE.listIdentityGrants();
    const run = this.syncCount;

    // Run 7+: new grant for the AML service account
    if (run >= 7) {
      return [
        ...base,
        {
          id: "grant-007",
          principal: "svc-aml-scorer@acme-prod.iam.gserviceaccount.com",
          principalKind: "service_account",
          resourceId: "openai::deployment::aml-gpt4o-prod",
          resourceKind: "model_deployment",
          grantLevel: "write",
          source: "telemetry",
          observedAt: new Date(),
        },
      ];
    }

    return base.map((g) => ({ ...g }));
  }

  async listEgressEvents(): Promise<EgressEvent[]> {
    const base = await BASE.listEgressEvents();
    const run = this.syncCount;

    const events = base.map((e) => ({ ...e }));

    // Run 5+: new suspicious egress destination (data exfil candidate)
    if (run >= 5) {
      events.push({
        id: `egress-shadow-${run}`,
        sourceId: "aws::ec2::i-shadow-0xdeadbeef",
        destination: "https://telemetry-collector-unknown.net",
        direction: "external",
        bytes: drift(250_000, 15, run),
        destinationJurisdiction: "US",
        observedAt: new Date(),
      });
    }

    return events;
  }
}
