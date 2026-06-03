/**
 * ConnectorRegistry — tracks registered connectors and their sync state.
 *
 * Responsibilities:
 *  - Register / deregister connector instances with their declared scope.
 *  - Record sync outcomes (lastSyncAt, status, lastError).
 *  - Provide a read-only view of the current registry state.
 *
 * The registry itself never calls connectors — that is the sync worker's job (Phase 4).
 */

import type { ConnectorRecord, ConnectorStatus, IConnector } from "./types";

export class ConnectorRegistry {
  private readonly records = new Map<string, ConnectorRecord>();

  /**
   * Register a connector with its declared read scopes.
   * Replaces any existing record for the same connector id.
   */
  register(connector: IConnector, scope: string[]): void {
    this.records.set(connector.id, {
      connector,
      scope,
      status: "never_synced",
      lastSyncAt: null,
      lastError: null,
    });
  }

  /** Remove a connector from the registry. */
  deregister(connectorId: string): boolean {
    return this.records.delete(connectorId);
  }

  /** Retrieve a single connector record by id. */
  get(connectorId: string): ConnectorRecord | undefined {
    return this.records.get(connectorId);
  }

  /** List all registered connector records (snapshot). */
  list(): ConnectorRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Record the outcome of a sync run.
   * Called by the sync worker after each connector poll.
   */
  recordSync(
    connectorId: string,
    outcome: { status: ConnectorStatus; error?: string },
  ): void {
    const record = this.records.get(connectorId);
    if (!record) {
      throw new Error(`ConnectorRegistry: unknown connector id "${connectorId}"`);
    }
    record.status = outcome.status;
    record.lastError = outcome.error ?? null;
    if (outcome.status !== "error") {
      record.lastSyncAt = new Date();
    }
  }

  /** Mark a connector as currently syncing. */
  markSyncing(connectorId: string): void {
    this.recordSync(connectorId, { status: "syncing" });
  }

  /** Total number of registered connectors. */
  get size(): number {
    return this.records.size;
  }
}
