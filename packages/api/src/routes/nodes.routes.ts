/**
 * Node mutation routes — manual create, annotate, confirm.
 *
 * PRINCIPLE 2 (Continuous, not point-in-time):
 *   Manually created/updated nodes are visibly flagged with source=MANUAL.
 *   The actor field on every Event records who made the change.
 *
 * PRINCIPLE 3 (Evidenced, not complete):
 *   Manually created nodes appear as MANUAL_ONLY blind spots in the coverage
 *   report until corroborated by telemetry.
 */

import { Router, Request, Response } from "express";
import type { PrismaClient } from "@prisma/client";
import { PrismaGraphRepository } from "@sentinel/db";
import type { NodeType } from "@sentinel/db";
import { nodeId as makeNodeId } from "@sentinel/core";
import { randomUUID } from "crypto";

const VALID_NODE_TYPES: NodeType[] = [
  "USE_CASE",
  "ASSET",
  "VENDOR",
  "DATA_ASSET",
  "JURISDICTION",
];

export function nodesRouter(db: PrismaClient): Router {
  const router = Router();
  const repo = new PrismaGraphRepository(db);

  // -------------------------------------------------------------------------
  // GET /nodes  — list all nodes, optionally filtered by type
  // -------------------------------------------------------------------------
  router.get("/", async (req: Request, res: Response) => {
    try {
      const type = req.query.type as NodeType | undefined;
      if (type && !VALID_NODE_TYPES.includes(type)) {
        res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_NODE_TYPES.join(", ")}` });
        return;
      }
      const nodes = await repo.listNodes(type);
      res.json({ data: nodes, count: nodes.length });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // GET /nodes/:id  — single node
  // -------------------------------------------------------------------------
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const node = await repo.getNodeWithEdges(req.params.id);
      if (!node) { res.status(404).json({ error: "Node not found" }); return; }
      res.json(node);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // POST /nodes  — manually create a node
  // Body: { type, label, attributes?, actor? }
  // Creates with source=MANUAL, confidence=LOW (requires confirmation)
  // -------------------------------------------------------------------------
  router.post("/", async (req: Request, res: Response) => {
    try {
      const { type, label, attributes = {}, actor = "user" } = req.body as {
        type: NodeType;
        label: string;
        attributes?: Record<string, unknown>;
        actor?: string;
      };

      if (!type || !VALID_NODE_TYPES.includes(type)) {
        res.status(400).json({ error: `type is required and must be one of: ${VALID_NODE_TYPES.join(", ")}` });
        return;
      }
      if (!label || typeof label !== "string" || label.trim().length === 0) {
        res.status(400).json({ error: "label is required and must be a non-empty string" });
        return;
      }

      // Derive a deterministic id from type + label; fall back to UUID for unnamed types
      const id = (() => {
        switch (type) {
          case "USE_CASE": return makeNodeId.useCase(label);
          case "VENDOR":   return makeNodeId.vendor(label);
          case "JURISDICTION": return makeNodeId.jurisdiction(label);
          default: return `${type.toLowerCase()}::manual::${randomUUID()}`;
        }
      })();

      const node = await repo.upsertNode({
        id,
        type,
        label: label.trim(),
        attributes,
        confidence: "LOW",       // manual entry always starts at LOW — Principle 2
        source: "MANUAL",
        actor,
      });

      res.status(201).json(node);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // PATCH /nodes/:id  — annotate / update a node's label or attributes
  // Body: { label?, attributes?, actor? }
  // -------------------------------------------------------------------------
  router.patch("/:id", async (req: Request, res: Response) => {
    try {
      const existing = await repo.getNode(req.params.id);
      if (!existing) { res.status(404).json({ error: "Node not found" }); return; }

      const { label, attributes, actor = "user" } = req.body as {
        label?: string;
        attributes?: Record<string, unknown>;
        actor?: string;
      };

      const node = await repo.upsertNode({
        id: existing.id,
        type: existing.type,
        label: label?.trim() ?? existing.label,
        attributes: attributes ?? (existing.attributes as Record<string, unknown>),
        confidence: existing.confidence,
        source: existing.source,
        connectorId: existing.connectorId ?? undefined,
        actor,
      });

      res.json(node);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // -------------------------------------------------------------------------
  // POST /nodes/:id/confirm  — confirm a LOW-confidence node
  // Writes NODE_CONFIRMED event and marks node confirmed=true
  // -------------------------------------------------------------------------
  router.post("/:id/confirm", async (req: Request, res: Response) => {
    try {
      const node = await repo.getNode(req.params.id);
      if (!node) { res.status(404).json({ error: "Node not found" }); return; }

      if (node.confidence !== "LOW") {
        res.status(400).json({
          error: `Node "${node.label}" has confidence=${node.confidence}. Only LOW-confidence nodes require confirmation.`,
        });
        return;
      }

      const actor = (req.body?.actor as string | undefined) ?? "user";

      // Upgrade confidence to MEDIUM on confirmation (telemetry will raise to HIGH on next sync)
      await repo.upsertNode({
        id: node.id,
        type: node.type,
        label: node.label,
        attributes: node.attributes as Record<string, unknown>,
        confidence: "MEDIUM",
        source: node.source,
        connectorId: node.connectorId ?? undefined,
        actor,
      });

      // Explicit confirmation event
      await repo.appendEvent({
        type: "NODE_CONFIRMED",
        nodeId: node.id,
        payload: { previousConfidence: "LOW", newConfidence: "MEDIUM" },
        actor,
      });

      const updated = await repo.getNode(node.id);
      res.json({ ok: true, node: updated });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  return router;
}
