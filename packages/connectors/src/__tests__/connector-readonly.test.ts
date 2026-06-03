/**
 * PRINCIPLE 4 — Read-only, least-privilege.
 *
 * This test asserts that IConnector (as implemented by MockCloudConnector)
 * exposes NO write-capable methods. It inspects the prototype's own property
 * names and rejects any that match known mutation verb patterns.
 *
 * When a real connector is added, include it in the CONNECTORS_UNDER_TEST array.
 */

import { MockCloudConnector } from "../mock/MockCloudConnector";
import type { IConnector } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Patterns that indicate a write/mutation method */
const WRITE_PATTERNS = [
  /^create/i,
  /^update/i,
  /^delete/i,
  /^remove/i,
  /^write/i,
  /^put/i,
  /^patch/i,
  /^post/i,
  /^insert/i,
  /^upsert/i,
  /^set(?!tings)/i, // "set" but not "settings"
  /^mutate/i,
  /^modify/i,
  /^save/i,
  /^upload/i,
  /^push/i,
];

function getMethodNames(instance: object): string[] {
  const proto = Object.getPrototypeOf(instance);
  return Object.getOwnPropertyNames(proto).filter(
    (name) => name !== "constructor" && typeof (instance as Record<string, unknown>)[name] === "function",
  );
}

function hasWriteMethod(instance: IConnector): string[] {
  return getMethodNames(instance).filter((name) =>
    WRITE_PATTERNS.some((pattern) => pattern.test(name)),
  );
}

// ---------------------------------------------------------------------------
// Connectors under test
// ---------------------------------------------------------------------------

const CONNECTORS_UNDER_TEST: IConnector[] = [new MockCloudConnector()];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Principle 4 — Connector read-only interface", () => {
  test.each(CONNECTORS_UNDER_TEST.map((c) => [c.name, c]))(
    "%s exposes no write/mutation methods",
    (_name, connector) => {
      const violations = hasWriteMethod(connector as IConnector);
      expect(violations).toEqual([]);
    },
  );

  test.each(CONNECTORS_UNDER_TEST.map((c) => [c.name, c]))(
    "%s exposes the four required read methods",
    (_name, connector) => {
      const methods = getMethodNames(connector as IConnector);
      expect(methods).toContain("listAssets");
      expect(methods).toContain("listModelDeployments");
      expect(methods).toContain("listIdentityGrants");
      expect(methods).toContain("listEgressEvents");
    },
  );

  test.each(CONNECTORS_UNDER_TEST.map((c) => [c.name, c]))(
    "%s has a stable readonly id and name",
    (_name, connector) => {
      const c = connector as IConnector;
      expect(typeof c.id).toBe("string");
      expect(c.id.length).toBeGreaterThan(0);
      expect(typeof c.name).toBe("string");
      expect(c.name.length).toBeGreaterThan(0);
    },
  );
});
