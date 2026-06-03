import { ConnectorRegistry } from "../ConnectorRegistry";
import { MockCloudConnector } from "../mock/MockCloudConnector";

function makeRegistry() {
  return new ConnectorRegistry();
}

const SCOPE = ["read:assets", "read:models", "read:grants", "read:egress"];

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

describe("ConnectorRegistry — registration", () => {
  it("starts empty", () => {
    const registry = makeRegistry();
    expect(registry.size).toBe(0);
    expect(registry.list()).toEqual([]);
  });

  it("registers a connector and retrieves it", () => {
    const registry = makeRegistry();
    const connector = new MockCloudConnector();
    registry.register(connector, SCOPE);

    expect(registry.size).toBe(1);
    const record = registry.get(connector.id);
    expect(record).toBeDefined();
    expect(record!.connector).toBe(connector);
    expect(record!.scope).toEqual(SCOPE);
  });

  it("initial status is never_synced with null lastSyncAt", () => {
    const registry = makeRegistry();
    registry.register(new MockCloudConnector(), SCOPE);
    const record = registry.list()[0];
    expect(record.status).toBe("never_synced");
    expect(record.lastSyncAt).toBeNull();
    expect(record.lastError).toBeNull();
  });

  it("re-registering same id replaces the existing record", () => {
    const registry = makeRegistry();
    const c1 = new MockCloudConnector();
    registry.register(c1, ["read:assets"]);
    registry.register(c1, ["read:assets", "read:models"]);
    expect(registry.size).toBe(1);
    expect(registry.get(c1.id)!.scope).toHaveLength(2);
  });

  it("deregisters a connector", () => {
    const registry = makeRegistry();
    const connector = new MockCloudConnector();
    registry.register(connector, SCOPE);
    const removed = registry.deregister(connector.id);
    expect(removed).toBe(true);
    expect(registry.size).toBe(0);
  });

  it("deregister returns false for unknown id", () => {
    const registry = makeRegistry();
    expect(registry.deregister("no-such-id")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Sync state
// ---------------------------------------------------------------------------

describe("ConnectorRegistry — sync state", () => {
  it("markSyncing sets status to syncing", () => {
    const registry = makeRegistry();
    const connector = new MockCloudConnector();
    registry.register(connector, SCOPE);
    registry.markSyncing(connector.id);
    expect(registry.get(connector.id)!.status).toBe("syncing");
  });

  it("recordSync with idle sets lastSyncAt to now", () => {
    const registry = makeRegistry();
    const connector = new MockCloudConnector();
    registry.register(connector, SCOPE);

    const before = Date.now();
    registry.recordSync(connector.id, { status: "idle" });
    const after = Date.now();

    const record = registry.get(connector.id)!;
    expect(record.status).toBe("idle");
    expect(record.lastSyncAt).not.toBeNull();
    expect(record.lastSyncAt!.getTime()).toBeGreaterThanOrEqual(before);
    expect(record.lastSyncAt!.getTime()).toBeLessThanOrEqual(after);
  });

  it("recordSync with error preserves lastSyncAt from previous successful sync", () => {
    const registry = makeRegistry();
    const connector = new MockCloudConnector();
    registry.register(connector, SCOPE);

    registry.recordSync(connector.id, { status: "idle" });
    const lastGoodSync = registry.get(connector.id)!.lastSyncAt;

    registry.recordSync(connector.id, { status: "error", error: "connection timeout" });
    const record = registry.get(connector.id)!;

    expect(record.status).toBe("error");
    expect(record.lastError).toBe("connection timeout");
    // lastSyncAt should still be the time of the last *successful* sync
    expect(record.lastSyncAt).toEqual(lastGoodSync);
  });

  it("throws for unknown connectorId", () => {
    const registry = makeRegistry();
    expect(() => registry.recordSync("bad-id", { status: "idle" })).toThrow(
      /unknown connector id/,
    );
  });
});

// ---------------------------------------------------------------------------
// Scope is read-only in records
// ---------------------------------------------------------------------------

describe("ConnectorRegistry — scope integrity", () => {
  it("scope registered is faithfully stored", () => {
    const registry = makeRegistry();
    registry.register(new MockCloudConnector(), SCOPE);
    const record = registry.list()[0];
    expect(record.scope).toEqual(SCOPE);
  });
});
