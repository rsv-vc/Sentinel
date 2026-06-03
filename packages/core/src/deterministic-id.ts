/**
 * deterministic-id — content-addressed node IDs.
 *
 * IDs are derived from the tuple (namespace, ...parts) using a simple
 * FNV-1a 32-bit hash encoded as hex. This means the same vendor resource
 * always produces the same GraphNode id, enabling safe upserts across syncs
 * without needing a separate deduplication step.
 *
 * Format: "<namespace>::<hex-hash>"
 * Example: "asset::a3f2c1b4"
 */

/**
 * FNV-1a 32-bit hash over an arbitrary string.
 * Chosen because it is fast, has good distribution for short strings,
 * and requires no external dependency.
 */
function fnv1a32(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // Multiply by the 32-bit FNV prime (0x01000193), keeping within 32 bits
    hash = (Math.imul(hash, 0x01000193) >>> 0);
  }
  return hash >>> 0;
}

/**
 * Derive a stable, deterministic node ID from a namespace and one or more
 * identifying parts.  Parts are joined with "|" before hashing so that
 * ("a", "b|c") and ("a|b", "c") produce different hashes.
 */
export function deterministicId(namespace: string, ...parts: string[]): string {
  const input = parts.join("|");
  const hash = fnv1a32(input).toString(16).padStart(8, "0");
  return `${namespace}::${hash}`;
}

// ---------------------------------------------------------------------------
// Convenience builders for each node type
// ---------------------------------------------------------------------------

export const nodeId = {
  asset: (vendorId: string) => deterministicId("asset", vendorId),
  vendor: (vendorName: string) => deterministicId("vendor", vendorName.toLowerCase()),
  model: (vendorId: string) => deterministicId("model", vendorId),
  useCase: (label: string) => deterministicId("usecase", label.toLowerCase().replace(/\s+/g, "-")),
  dataAsset: (vendorId: string) => deterministicId("data", vendorId),
  jurisdiction: (code: string) => `jurisdiction::${code.toUpperCase()}`,
};
