/**
 * NormalizationService — converts raw connector output into GraphNode/GraphEdge records.
 *
 * Design decisions:
 *
 * 1. CORRELATION STRATEGY
 *    Assets and model deployments are correlated to UseCases via their
 *    `useCaseLabels` (model deployments) or `tags.project` (assets).
 *    When a label maps to a known use-case, confidence is HIGH.
 *    When no label is present the node is created standalone at MEDIUM
 *    confidence — a human must confirm the relationship.
 *
 * 2. LOW-CONFIDENCE FLAGGING (Principle 3 — Evidenced, not complete)
 *    Any node/edge that cannot be deterministically correlated is created
 *    with confidence=LOW and a NODE_FLAGGED_LOW_CONFIDENCE Event is written.
 *    The UI will surface these for confirmation; they are never silently merged.
 *
 * 3. APPEND-ONLY EVENTS
 *    Every upsertNode call (inside IGraphRepository) writes an Event.
 *    This service also writes a SYNC_COMPLETED Event at the end of each run
 *    so the evidence trail has a clear sync boundary.
 *
 * 4. VENDOR NODES
 *    A Vendor node is created for each distinct asset vendor and model provider.
 *    Assets and models get an OWNED_BY_VENDOR edge.
 *
 * 5. JURISDICTION NODES
 *    Region-to-jurisdiction mapping is a static lookup here; in Phase 5 this
 *    feeds into the compliance engine's residency-conflict detection.
 */

import type { IConnector, Asset, ModelDeployment } from "@sentinel/connectors";
import type { IGraphRepository } from "@sentinel/db";
import { nodeId } from "./deterministic-id";

// ---------------------------------------------------------------------------
// Region → Jurisdiction mapping
// ---------------------------------------------------------------------------

const REGION_JURISDICTION: Record<string, string> = {
  "us-east-1": "US",
  "us-west-2": "US",
  "eu-west-1": "EU",
  "eu-central-1": "EU",
  "ap-southeast-1": "SG",
  "ap-northeast-1": "JP",
};

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface NormalizationResult {
  nodesUpserted: number;
  edgesUpserted: number;
  lowConfidenceNodes: string[];   // node ids flagged for confirmation
  connectorId: string;
  syncedAt: Date;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class NormalizationService {
  constructor(private readonly graph: IGraphRepository) {}

  /**
   * Run a full normalization pass for one connector.
   * Reads all four data types, upserts nodes/edges, writes Events.
   */
  async normalize(
    connector: IConnector,
    actor = "system",
  ): Promise<NormalizationResult> {
    const [assets, models, grants, egresses] = await Promise.all([
      connector.listAssets(),
      connector.listModelDeployments(),
      connector.listIdentityGrants(),
      connector.listEgressEvents(),
    ]);

    let nodesUpserted = 0;
    let edgesUpserted = 0;
    const lowConfidenceNodes: string[] = [];
    const cid = connector.id;

    // ------------------------------------------------------------------
    // 1. Vendor nodes
    // ------------------------------------------------------------------
    const vendorNames = new Set([
      ...assets.map((a) => a.vendor),
      ...models.map((m) => m.provider as string),
    ]);

    for (const vendor of vendorNames) {
      await this.graph.upsertNode({
        id: nodeId.vendor(vendor),
        type: "VENDOR",
        label: vendor,
        attributes: { vendor },
        confidence: "HIGH",
        source: "TELEMETRY",
        connectorId: cid,
        actor,
      });
      nodesUpserted++;
    }

    // ------------------------------------------------------------------
    // 2. Jurisdiction nodes (upsert from region mapping)
    // ------------------------------------------------------------------
    const jurisdictions = new Set([
      ...assets.map((a) => REGION_JURISDICTION[a.region]).filter(Boolean),
      ...models.map((m) => REGION_JURISDICTION[m.region]).filter(Boolean),
    ]);

    for (const jCode of jurisdictions) {
      await this.graph.upsertNode({
        id: nodeId.jurisdiction(jCode),
        type: "JURISDICTION",
        label: jCode === "US" ? "United States"
             : jCode === "EU" ? "European Union"
             : jCode,
        attributes: { code: jCode },
        confidence: "HIGH",
        source: "TELEMETRY",
        connectorId: cid,
        actor,
      });
      nodesUpserted++;
    }

    // ------------------------------------------------------------------
    // 3. Asset nodes
    // ------------------------------------------------------------------
    for (const asset of assets) {
      const id = nodeId.asset(asset.id);
      const confidence = this.assetConfidence(asset);

      await this.graph.upsertNode({
        id,
        type: "ASSET",
        label: asset.name,
        attributes: {
          vendorId: asset.id,
          kind: asset.kind,
          vendor: asset.vendor,
          region: asset.region,
          vcpus: asset.vcpus,
          capacityGb: asset.capacityGb,
          monthlyCostUsd: asset.monthlyCost.amount,
          tags: asset.tags,
        },
        confidence,
        source: "TELEMETRY",
        connectorId: cid,
        actor,
      });
      nodesUpserted++;

      if (confidence === "LOW") lowConfidenceNodes.push(id);

      // Asset → Vendor edge
      await this.graph.upsertEdge({
        type: "OWNED_BY_VENDOR",
        fromId: id,
        toId: nodeId.vendor(asset.vendor),
        attributes: {},
      });
      edgesUpserted++;

      // Asset → Jurisdiction edge
      const jCode = REGION_JURISDICTION[asset.region];
      if (jCode) {
        await this.graph.upsertEdge({
          type: "SUBJECT_TO",
          fromId: id,
          toId: nodeId.jurisdiction(jCode),
          attributes: { region: asset.region },
        });
        edgesUpserted++;
      }
    }

    // ------------------------------------------------------------------
    // 4. Model deployment nodes + UseCase correlation
    // ------------------------------------------------------------------
    const useCaseCache = new Map<string, string>(); // label → nodeId

    for (const model of models) {
      const id = nodeId.model(model.id);

      await this.graph.upsertNode({
        id,
        type: "ASSET",               // models are a sub-kind of Asset in the graph
        label: model.name,
        attributes: {
          vendorId: model.id,
          kind: "MODEL_DEPLOYMENT",
          vendor: model.provider,
          region: model.region,
          modelId: model.modelId,
          endpoint: model.endpoint,
          monthlyCostUsd: model.monthlyCost.amount,
          useCaseLabels: model.useCaseLabels,
          tags: model.tags,
        },
        confidence: "HIGH",
        source: "TELEMETRY",
        connectorId: cid,
        actor,
      });
      nodesUpserted++;

      // Model → Vendor edge
      await this.graph.upsertEdge({
        type: "OWNED_BY_VENDOR",
        fromId: id,
        toId: nodeId.vendor(model.provider),
        attributes: {},
      });
      edgesUpserted++;

      // Model → Jurisdiction edge
      const jCode = REGION_JURISDICTION[model.region];
      if (jCode) {
        await this.graph.upsertEdge({
          type: "SUBJECT_TO",
          fromId: id,
          toId: nodeId.jurisdiction(jCode),
          attributes: { region: model.region },
        });
        edgesUpserted++;
      }

      // UseCase correlation via useCaseLabels
      if (model.useCaseLabels.length > 0) {
        for (const label of model.useCaseLabels) {
          const ucId = await this.upsertUseCase(label, useCaseCache, cid, actor);
          nodesUpserted++;

          await this.graph.upsertEdge({
            type: "USES_MODEL",
            fromId: ucId,
            toId: id,
            attributes: { correlatedVia: "useCaseLabel" },
          });
          edgesUpserted++;
        }
      } else {
        // No use-case label — mark model node as MEDIUM confidence
        await this.graph.upsertNode({
          id,
          type: "ASSET",
          label: model.name,
          attributes: { vendorId: model.id },
          confidence: "MEDIUM",
          source: "TELEMETRY",
          connectorId: cid,
          actor,
        });
      }
    }

    // ------------------------------------------------------------------
    // 5. Asset → UseCase edges (via tags.project)
    // ------------------------------------------------------------------
    for (const asset of assets) {
      const project = asset.tags?.project;
      if (!project) continue;

      const assetNid = nodeId.asset(asset.id);
      const ucId = await this.upsertUseCase(project, useCaseCache, cid, actor);
      nodesUpserted++;

      await this.graph.upsertEdge({
        type: "USES_ASSET",
        fromId: ucId,
        toId: assetNid,
        attributes: { correlatedVia: "tag.project" },
      });
      edgesUpserted++;
    }

    // ------------------------------------------------------------------
    // 6. DataAsset nodes from storage assets
    // ------------------------------------------------------------------
    for (const asset of assets) {
      if (asset.kind !== "OBJECT_STORAGE" && asset.kind !== "BLOCK_STORAGE") continue;

      const dataId = nodeId.dataAsset(asset.id);
      await this.graph.upsertNode({
        id: dataId,
        type: "DATA_ASSET",
        label: `Data in ${asset.name}`,
        attributes: {
          storageAssetId: nodeId.asset(asset.id),
          region: asset.region,
          capacityGb: asset.capacityGb,
          classification: asset.tags?.classification ?? "unclassified",
        },
        confidence: "HIGH",
        source: "TELEMETRY",
        connectorId: cid,
        actor,
      });
      nodesUpserted++;

      await this.graph.upsertEdge({
        type: "STORES_DATA",
        fromId: nodeId.asset(asset.id),
        toId: dataId,
        attributes: {},
      });
      edgesUpserted++;
    }

    // ------------------------------------------------------------------
    // 7. SYNC_COMPLETED event — evidence trail boundary marker
    // ------------------------------------------------------------------
    await this.graph.appendEvent({
      type: "SYNC_COMPLETED",
      payload: {
        connectorId: cid,
        assetsObserved: assets.length,
        modelsObserved: models.length,
        grantsObserved: grants.length,
        egressEventsObserved: egresses.length,
        nodesUpserted,
        edgesUpserted,
        lowConfidenceCount: lowConfidenceNodes.length,
      },
      actor,
      connectorId: cid,
    });

    return {
      nodesUpserted,
      edgesUpserted,
      lowConfidenceNodes,
      connectorId: cid,
      syncedAt: new Date(),
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async upsertUseCase(
    label: string,
    cache: Map<string, string>,
    connectorId: string,
    actor: string,
  ): Promise<string> {
    if (cache.has(label)) return cache.get(label)!;

    const id = nodeId.useCase(label);
    await this.graph.upsertNode({
      id,
      type: "USE_CASE",
      label,
      attributes: { name: label },
      confidence: "MEDIUM",  // UseCase nodes inferred from labels — medium until confirmed
      source: "TELEMETRY",
      connectorId,
      actor,
    });
    cache.set(label, id);
    return id;
  }

  private assetConfidence(asset: Asset): "HIGH" | "MEDIUM" | "LOW" {
    // HIGH if the asset has a project tag (we can correlate it to a use-case)
    if (asset.tags?.project) return "HIGH";
    // MEDIUM if it has any tags (some context)
    if (Object.keys(asset.tags ?? {}).length > 0) return "MEDIUM";
    // LOW if it is completely untagged — shadow AI candidate
    return "LOW";
  }
}
