import { MockCloudConnector } from "../mock/MockCloudConnector";

const connector = new MockCloudConnector();

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

describe("MockCloudConnector.listAssets", () => {
  it("returns 5 assets (2 GPU, 1 compute, 2 storage)", async () => {
    const assets = await connector.listAssets();
    expect(assets).toHaveLength(5);

    const gpuCount = assets.filter((a) => a.kind === "GPU_INSTANCE").length;
    const computeCount = assets.filter((a) => a.kind === "COMPUTE_INSTANCE").length;
    const storageCount = assets.filter((a) => a.kind === "OBJECT_STORAGE").length;

    expect(gpuCount).toBe(2);
    expect(computeCount).toBe(1);
    expect(storageCount).toBe(2);
  });

  it("every asset has a non-empty id, name, vendor, region, and monthlyCost", async () => {
    const assets = await connector.listAssets();
    for (const asset of assets) {
      expect(asset.id).toBeTruthy();
      expect(asset.name).toBeTruthy();
      expect(asset.vendor).toBeTruthy();
      expect(asset.region).toBeTruthy();
      expect(asset.monthlyCost.amount).toBeGreaterThan(0);
      expect(asset.monthlyCost.currency).toBe("USD");
    }
  });

  it("returns a new array each call (no shared references)", async () => {
    const a = await connector.listAssets();
    const b = await connector.listAssets();
    expect(a).not.toBe(b);
    a[0].name = "MUTATED";
    expect(b[0].name).not.toBe("MUTATED");
  });
});

// ---------------------------------------------------------------------------
// Model deployments
// ---------------------------------------------------------------------------

describe("MockCloudConnector.listModelDeployments", () => {
  it("returns 2 deployments", async () => {
    const models = await connector.listModelDeployments();
    expect(models).toHaveLength(2);
  });

  it("covers openai and anthropic providers", async () => {
    const models = await connector.listModelDeployments();
    const providers = models.map((m) => m.provider);
    expect(providers).toContain("openai");
    expect(providers).toContain("anthropic");
  });

  it("each deployment has a region and a positive monthly cost", async () => {
    const models = await connector.listModelDeployments();
    for (const m of models) {
      expect(m.region).toBeTruthy();
      expect(m.monthlyCost.amount).toBeGreaterThan(0);
    }
  });

  it("each deployment has at least one use-case label", async () => {
    const models = await connector.listModelDeployments();
    for (const m of models) {
      expect(m.useCaseLabels.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Identity grants
// ---------------------------------------------------------------------------

describe("MockCloudConnector.listIdentityGrants", () => {
  it("returns 6 grants", async () => {
    const grants = await connector.listIdentityGrants();
    expect(grants).toHaveLength(6);
  });

  it("includes at least one manual-source grant (to flag for review)", async () => {
    const grants = await connector.listIdentityGrants();
    const manual = grants.filter((g) => g.source === "manual");
    expect(manual.length).toBeGreaterThan(0);
  });

  it("includes human, service_account, and group principals", async () => {
    const grants = await connector.listIdentityGrants();
    const kinds = new Set(grants.map((g) => g.principalKind));
    expect(kinds.has("human")).toBe(true);
    expect(kinds.has("service_account")).toBe(true);
    expect(kinds.has("group")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Egress events
// ---------------------------------------------------------------------------

describe("MockCloudConnector.listEgressEvents", () => {
  it("returns 8 egress events", async () => {
    const events = await connector.listEgressEvents();
    expect(events).toHaveLength(8);
  });

  it("includes cross_border events (potential GDPR flag)", async () => {
    const events = await connector.listEgressEvents();
    const crossBorder = events.filter((e) => e.direction === "cross_border");
    expect(crossBorder.length).toBeGreaterThan(0);
  });

  it("every event has a positive byte count", async () => {
    const events = await connector.listEgressEvents();
    for (const e of events) {
      expect(e.bytes).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe("MockCloudConnector determinism", () => {
  it("returns identical asset ids across two calls", async () => {
    const a = await connector.listAssets();
    const b = await connector.listAssets();
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  });

  it("returns identical model deployment ids across two calls", async () => {
    const a = await connector.listModelDeployments();
    const b = await connector.listModelDeployments();
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id));
  });
});
