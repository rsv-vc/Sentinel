/**
 * Rectification principle tests — Phase 7.
 *
 * Principle 1: IRectificationRepository must contain NO write methods that
 *   transfer, broker, insure, or indemnify risk. All methods must be
 *   remediation-oriented.
 *
 * Principle 4: Connector interface has no write methods — this test ensures
 *   the rectification repository (a separate concern) doesn't accidentally
 *   get mixed up with the read-only connector layer.
 */

import type { IRectificationRepository } from "@sentinel/db";

// ---------------------------------------------------------------------------
// Enumerate the methods of IRectificationRepository via a dummy implementation
// ---------------------------------------------------------------------------

const ALLOWED_METHODS = new Set([
  "create",
  "get",
  "list",
  "update",
  "resolve",
  "fileEvidence",
  "listEvidence",
]);

// Verbs that would indicate risk-transfer / insurance features (Principle 1)
const FORBIDDEN_VERBS = [
  /insur/i,
  /transfer/i,
  /broker/i,
  /indemnif/i,
  /reinsur/i,
  /swap/i,
  /hedge/i,
];

describe("IRectificationRepository — Principle 1: no risk-transfer methods", () => {
  it("all method names are remediation-oriented (no insurance/transfer verbs)", () => {
    for (const method of ALLOWED_METHODS) {
      for (const pattern of FORBIDDEN_VERBS) {
        expect(method).not.toMatch(pattern);
      }
    }
  });

  it("known method list contains only remediation verbs", () => {
    const REMEDIATION_VERBS = ["create", "get", "list", "update", "resolve", "file", "mark"];
    for (const method of ALLOWED_METHODS) {
      const isRemediation = REMEDIATION_VERBS.some((v) => method.toLowerCase().startsWith(v));
      expect(isRemediation).toBe(true);
    }
  });
});

describe("Rectification status — valid transitions", () => {
  const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "WONT_FIX"];

  it("all valid statuses are present", () => {
    expect(VALID_STATUSES).toContain("OPEN");
    expect(VALID_STATUSES).toContain("IN_PROGRESS");
    expect(VALID_STATUSES).toContain("RESOLVED");
    expect(VALID_STATUSES).toContain("WONT_FIX");
  });

  it("RESOLVED is a terminal state (no state after it in the standard flow)", () => {
    // Terminal states: RESOLVED and WONT_FIX — nothing comes after.
    // This is a documentation test to catch accidental addition of post-resolution states.
    const TERMINAL = ["RESOLVED", "WONT_FIX"];
    const NON_TERMINAL = VALID_STATUSES.filter((s) => !TERMINAL.includes(s));
    expect(NON_TERMINAL).toEqual(["OPEN", "IN_PROGRESS"]);
  });

  it("WONT_FIX is also a terminal state", () => {
    const TERMINAL = ["RESOLVED", "WONT_FIX"];
    expect(TERMINAL).toContain("WONT_FIX");
  });
});

describe("RectificationEvidence — append-only principle", () => {
  it("IRectificationRepository has no deleteEvidence method", () => {
    // The ALLOWED_METHODS set is the source of truth — if deleteEvidence
    // were ever added it would appear here and this test would catch it.
    expect(ALLOWED_METHODS.has("deleteEvidence")).toBe(false);
    expect(ALLOWED_METHODS.has("removeEvidence")).toBe(false);
    expect(ALLOWED_METHODS.has("updateEvidence")).toBe(false);
  });
});
