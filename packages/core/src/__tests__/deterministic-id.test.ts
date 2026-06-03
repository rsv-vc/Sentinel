import { deterministicId, nodeId } from "../deterministic-id";

describe("deterministicId", () => {
  it("returns the same id for the same inputs", () => {
    expect(deterministicId("asset", "aws::i-001")).toBe(deterministicId("asset", "aws::i-001"));
  });

  it("returns different ids for different inputs", () => {
    expect(deterministicId("asset", "aws::i-001")).not.toBe(deterministicId("asset", "aws::i-002"));
  });

  it("includes the namespace prefix", () => {
    expect(deterministicId("vendor", "aws")).toMatch(/^vendor::/);
  });

  it("different namespaces produce different ids for the same part", () => {
    expect(deterministicId("asset", "x")).not.toBe(deterministicId("vendor", "x"));
  });
});

describe("nodeId builders", () => {
  it("asset ids are stable", () => {
    const id = "aws::ec2::i-123";
    expect(nodeId.asset(id)).toBe(nodeId.asset(id));
    expect(nodeId.asset(id)).toMatch(/^asset::/);
  });

  it("vendor names are lowercased before hashing", () => {
    expect(nodeId.vendor("AWS")).toBe(nodeId.vendor("aws"));
  });

  it("jurisdiction returns expected format", () => {
    expect(nodeId.jurisdiction("eu")).toBe("jurisdiction::EU");
    expect(nodeId.jurisdiction("US")).toBe("jurisdiction::US");
  });

  it("useCase normalises whitespace", () => {
    expect(nodeId.useCase("Fraud Detection")).toBe(nodeId.useCase("fraud detection"));
    expect(nodeId.useCase("fraud detection")).toMatch(/^usecase::/);
  });
});
