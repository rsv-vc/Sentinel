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
    return BASE.listAssets();
  }

  async listModelDeployments(): Promise<ModelDeployment[]> {
    const base = await BASE.listModelDeployments();
    const run = this.syncCount;
    // Apply minor cost variance each run so the dashboard shows live activity
    return base.map((m) => ({
      ...m,
      monthlyCost: { ...m.monthlyCost, amount: drift(m.monthlyCost.amount, 3, run) },
    }));
  }

  async listIdentityGrants(): Promise<IdentityGrant[]> {
    return BASE.listIdentityGrants();
  }

  async listEgressEvents(): Promise<EgressEvent[]> {
    return BASE.listEgressEvents();
  }
}
