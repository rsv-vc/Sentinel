import { PrismaClient } from "@prisma/client";
import type {
  CreateRectificationInput,
  UpdateRectificationInput,
  FileEvidenceInput,
  IRectificationRepository,
  Rectification,
  RectificationEvidence,
  RectificationStatus,
  RectificationWithEvidence,
} from "./rectification.repository.interface";

export class PrismaRectificationRepository implements IRectificationRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: CreateRectificationInput): Promise<Rectification> {
    return this.db.rectification.create({
      data: {
        title:       input.title,
        description: input.description ?? "",
        nodeId:      input.nodeId,
        obligationId: input.obligationId,
        dimensionId: input.dimensionId,
        priority:    input.priority ?? "MEDIUM",
        actor:       input.actor ?? "user",
        dueDate:     input.dueDate,
        status:      "OPEN",
      },
    });
  }

  async get(id: string): Promise<RectificationWithEvidence | null> {
    return this.db.rectification.findUnique({
      where: { id },
      include: { evidence: { orderBy: { createdAt: "asc" } } },
    });
  }

  async list(filters?: { nodeId?: string; status?: RectificationStatus; obligationId?: string }): Promise<Rectification[]> {
    return this.db.rectification.findMany({
      where: {
        ...(filters?.nodeId       ? { nodeId: filters.nodeId }             : {}),
        ...(filters?.status       ? { status: filters.status }             : {}),
        ...(filters?.obligationId ? { obligationId: filters.obligationId } : {}),
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }

  async update(id: string, input: UpdateRectificationInput): Promise<Rectification> {
    return this.db.rectification.update({
      where: { id },
      data: {
        ...(input.title       !== undefined ? { title: input.title }             : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status      !== undefined ? { status: input.status }           : {}),
        ...(input.priority    !== undefined ? { priority: input.priority }       : {}),
        ...(input.dueDate     !== undefined ? { dueDate: input.dueDate }         : {}),
      },
    });
  }

  async resolve(id: string, _actor = "user"): Promise<Rectification> {
    return this.db.rectification.update({
      where: { id },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
  }

  async fileEvidence(input: FileEvidenceInput): Promise<RectificationEvidence> {
    return this.db.rectificationEvidence.create({
      data: {
        rectificationId: input.rectificationId,
        content:         input.content,
        actor:           input.actor ?? "user",
      },
    });
  }

  async listEvidence(rectificationId: string): Promise<RectificationEvidence[]> {
    return this.db.rectificationEvidence.findMany({
      where: { rectificationId },
      orderBy: { createdAt: "asc" },
    });
  }
}
