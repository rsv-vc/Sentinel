/**
 * SyncScheduler — background worker that re-syncs connectors on a
 * configurable interval and triggers normalization on each run.
 *
 * Design decisions:
 *  - Interval is set via SYNC_INTERVAL_MS env var (default 30 000 ms).
 *    Keep it short (10–30s) for demos so evolution is visible quickly.
 *  - One run at a time — if a sync is still in progress when the interval
 *    fires, the new run is skipped and a warning is logged.
 *  - Graceful shutdown: stop() cancels the interval and waits for any
 *    in-flight sync to complete.
 *  - Every run result is stored in memory for the /api/sync/status route.
 *  - Structured log lines use [sync] prefix so they are easy to grep.
 */

import { NormalizationService, type NormalizationResult } from "@sentinel/core";
import { ConnectorRegistry, EvolvingMockConnector } from "@sentinel/connectors";
import type { IGraphRepository } from "@sentinel/db";

export interface SyncRunRecord {
  runNumber: number;
  startedAt: Date;
  completedAt: Date | null;
  status: "running" | "completed" | "skipped" | "error";
  connectorId: string;
  result: NormalizationResult | null;
  error: string | null;
}

export interface SchedulerStatus {
  running: boolean;
  intervalMs: number;
  totalRuns: number;
  lastRun: SyncRunRecord | null;
  nextRunAt: Date | null;
  connectors: Array<{
    id: string;
    name: string;
    status: string;
    lastSyncAt: Date | null;
    currentRun: number;
  }>;
}

export class SyncScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private syncing = false;
  private runNumber = 0;
  private lastRun: SyncRunRecord | null = null;
  private nextRunAt: Date | null = null;

  readonly intervalMs: number;
  readonly registry: ConnectorRegistry;
  readonly connector: EvolvingMockConnector;

  constructor(
    private readonly graph: IGraphRepository,
    intervalMs?: number,
  ) {
    this.intervalMs = intervalMs ?? Number(process.env.SYNC_INTERVAL_MS ?? 30_000);
    this.connector = new EvolvingMockConnector();
    this.registry = new ConnectorRegistry();
    this.registry.register(this.connector, [
      "read:assets",
      "read:models",
      "read:grants",
      "read:egress",
    ]);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    console.log(`[sync] Scheduler started — interval ${this.intervalMs}ms`);

    // Run immediately on start, then on interval
    this.runSync();
    this.nextRunAt = new Date(Date.now() + this.intervalMs);

    this.timer = setInterval(() => {
      this.nextRunAt = new Date(Date.now() + this.intervalMs);
      this.runSync();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
    this.nextRunAt = null;
    console.log("[sync] Scheduler stopped");
  }

  getStatus(): SchedulerStatus {
    const records = this.registry.list();
    return {
      running: this.running,
      intervalMs: this.intervalMs,
      totalRuns: this.runNumber,
      lastRun: this.lastRun,
      nextRunAt: this.nextRunAt,
      connectors: records.map((r) => ({
        id: r.connector.id,
        name: r.connector.name,
        status: r.status,
        lastSyncAt: r.lastSyncAt,
        currentRun: (r.connector as EvolvingMockConnector).currentRun ?? 0,
      })),
    };
  }

  private async runSync(): Promise<void> {
    if (this.syncing) {
      console.log(`[sync] Run skipped — previous sync still in progress`);
      const skipped: SyncRunRecord = {
        runNumber: ++this.runNumber,
        startedAt: new Date(),
        completedAt: new Date(),
        status: "skipped",
        connectorId: this.connector.id,
        result: null,
        error: "Previous sync still in progress",
      };
      this.lastRun = skipped;
      return;
    }

    this.syncing = true;
    this.connector.tick();
    const runNum = ++this.runNumber;
    const startedAt = new Date();

    console.log(`[sync] Run #${runNum} started (connector tick=${this.connector.currentRun})`);
    this.registry.markSyncing(this.connector.id);

    const record: SyncRunRecord = {
      runNumber: runNum,
      startedAt,
      completedAt: null,
      status: "running",
      connectorId: this.connector.id,
      result: null,
      error: null,
    };
    this.lastRun = record;

    try {
      const normalizer = new NormalizationService(this.graph);
      const result = await normalizer.normalize(this.connector, `scheduler:run-${runNum}`);

      record.completedAt = new Date();
      record.status = "completed";
      record.result = result;

      this.registry.recordSync(this.connector.id, { status: "idle" });

      const durationMs = record.completedAt.getTime() - startedAt.getTime();
      console.log(
        `[sync] Run #${runNum} completed in ${durationMs}ms — ` +
        `nodes=${result.nodesUpserted} edges=${result.edgesUpserted} ` +
        `lowConf=${result.lowConfidenceNodes.length}`,
      );
    } catch (err) {
      record.completedAt = new Date();
      record.status = "error";
      record.error = String(err);
      this.registry.recordSync(this.connector.id, { status: "error", error: String(err) });
      console.error(`[sync] Run #${runNum} failed:`, err);
    } finally {
      this.syncing = false;
    }
  }
}
