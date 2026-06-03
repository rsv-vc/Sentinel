export { PrismaClient } from "@prisma/client";
export { PrismaGraphRepository } from "./graph.repository";
export type {
  AppendEventInput,
  CreateEdgeInput,
  CreateNodeInput,
  IGraphRepository,
  NodeWithEdges,
  UpsertNodeInput,
  // Prisma-generated types
  ConfidenceLevel,
  DataSource,
  EdgeType,
  Event,
  EventType,
  GraphEdge,
  GraphNode,
  NodeType,
} from "./graph.repository.interface";

// Singleton Prisma client
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
