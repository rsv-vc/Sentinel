/**
 * IRectificationRepository — swap-safe interface for Phase 7.
 *
 * Principle 1: no insurance, risk-transfer, or brokering methods anywhere.
 * All methods are remediation-oriented: open, update, file evidence, resolve.
 *
 * Evidence is append-only — there is no deleteEvidence method.
 */

import type {
  Rectification,
  RectificationEvidence,
  RectificationStatus,
  RectificationPriority,
} from "@prisma/client";

export type { Rectification, RectificationEvidence, RectificationStatus, RectificationPriority };

export interface RectificationWithEvidence extends Rectification {
  evidence: RectificationEvidence[];
}

export interface CreateRectificationInput {
  title: string;
  description?: string;
  nodeId?: string;
  obligationId?: string;
  dimensionId?: string;
  priority?: RectificationPriority;
  actor?: string;
  dueDate?: Date;
}

export interface UpdateRectificationInput {
  title?: string;
  description?: string;
  status?: RectificationStatus;
  priority?: RectificationPriority;
  dueDate?: Date | null;
  actor?: string;
}

export interface FileEvidenceInput {
  rectificationId: string;
  content: string;
  actor?: string;
}

export interface IRectificationRepository {
  create(input: CreateRectificationInput): Promise<Rectification>;
  get(id: string): Promise<RectificationWithEvidence | null>;
  list(filters?: { nodeId?: string; status?: RectificationStatus; obligationId?: string }): Promise<Rectification[]>;
  update(id: string, input: UpdateRectificationInput): Promise<Rectification>;
  resolve(id: string, actor?: string): Promise<Rectification>;
  fileEvidence(input: FileEvidenceInput): Promise<RectificationEvidence>;
  listEvidence(rectificationId: string): Promise<RectificationEvidence[]>;
}
