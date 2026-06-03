import { EvolvingMockConnector } from "../mock/EvolvingMockConnector";

function makeConnector(ticks: number): EvolvingMockConnector {
  const c = new EvolvingMockConnector();
  for (let i = 0; i < ticks; i++) c.tick();
  return c;
}

// ---------------------------------------------------------------------------
// Principle 4 — still read-only
// ---------------------------------------------------------------------------

describe("EvolvingMockConnector — Principle 4 (read-only)", () => {
  it("exposes no write methods", () => {
    const c = new EvolvingMockConnector();
    const WRITE = /^(create|update|delete|remove|write|put|patch|post|insert|upsert|save|upload|push|mutate|modify)/i;
    const proto = Object.getPrototypeOf(c);
    const violations = Object.getOwnPropertyNames(proto)
      .filter((n) => n !== "constructor" && typeof (c as unknown as Record<string, unknown>)[n] === "function")
      .filter((n) => WRITE.test(n));
    expect(violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Evolution schedule
// ---------------------------------------------------------------------------

describe("EvolvingMockConnector — evolution", () => {
  it("run 1: returns baseline asset count (5)", async () => {
    const c = makeConnector(1);
    expect((await c.listAssets())).toHaveLength(5);
  });

  it("run 3: shadow asset appears (6 assets total)", async () => {
    const c = makeConnector(3);
    const assets = await c.listAssets();
    expect(assets).toHaveLength(6);
    const shadow = assets.find((a) => a.id === "aws::ec2::i-shadow-0xdeadbeef");
    expect(shadow).toBeDefined();
    expect(shadow!.tags).toEqual({});  // intentionally untagged
  });

  it("run 3: shadow asset has no project tag — will be flagged LOW confidence", async () => {
    const c = makeConnector(3);
    const assets = await c.listAssets();
    const shadow = assets.find((a) => a.id === "aws::ec2::i-shadow-0xdeadbeef")!;
    expect(Object.keys(shadow.tags)).toHaveLength(0);
  });

  it("run 4: GPU costs differ from run 1 (drift applied)", async () => {
    const run1 = makeConnector(1);
    const run4 = makeConnector(4);
    const gpus1 = (await run1.listAssets()).filter((a) => a.kind === "GPU_INSTANCE");
    const gpus4 = (await run4.listAssets()).filter((a) => a.kind === "GPU_INSTANCE" && a.id !== "aws::ec2::i-shadow-0xdeadbeef");
    const changed = gpus4.some((g4, i) => g4.monthlyCost.amount !== gpus1[i]?.monthlyCost.amount);
    expect(changed).toBe(true);
  });

  it("run 5: suspicious egress event appears", async () => {
    const c = makeConnector(5);
    const events = await c.listEgressEvents();
    const shadow = events.find((e) => e.destination.includes("telemetry-collector-unknown"));
    expect(shadow).toBeDefined();
  });

  it("run 7: new model deployment appears (AML)", async () => {
    const c = makeConnector(7);
    const models = await c.listModelDeployments();
    const aml = models.find((m) => m.id === "openai::deployment::aml-gpt4o-prod");
    expect(aml).toBeDefined();
    expect(aml!.useCaseLabels).toContain("aml-transaction-screening");
  });

  it("run 7: new asset for AML use case appears", async () => {
    const c = makeConnector(7);
    const assets = await c.listAssets();
    const aml = assets.find((a) => a.id === "azure::vm::sentinel-aml-worker-01");
    expect(aml).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Determinism — same run → same output
// ---------------------------------------------------------------------------

describe("EvolvingMockConnector — determinism per run", () => {
  it("two connectors at the same tick produce the same asset ids", async () => {
    const a = makeConnector(5);
    const b = makeConnector(5);
    const idsA = (await a.listAssets()).map((x) => x.id).sort();
    const idsB = (await b.listAssets()).map((x) => x.id).sort();
    expect(idsA).toEqual(idsB);
  });
});
