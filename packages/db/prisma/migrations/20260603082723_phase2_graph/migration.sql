-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('USE_CASE', 'ASSET', 'VENDOR', 'DATA_ASSET', 'JURISDICTION');

-- CreateEnum
CREATE TYPE "EdgeType" AS ENUM ('USES_ASSET', 'USES_MODEL', 'OWNED_BY_VENDOR', 'STORES_DATA', 'SUBJECT_TO', 'HAS_GRANT', 'EGRESSES_TO');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('NODE_CREATED', 'NODE_UPDATED', 'NODE_FLAGGED_LOW_CONFIDENCE', 'NODE_CONFIRMED', 'EDGE_CREATED', 'EDGE_REMOVED', 'SYNC_COMPLETED');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('TELEMETRY', 'MANUAL');

-- CreateTable
CREATE TABLE "GraphNode" (
    "id" TEXT NOT NULL,
    "type" "NodeType" NOT NULL,
    "label" TEXT NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'HIGH',
    "source" "DataSource" NOT NULL DEFAULT 'TELEMETRY',
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "connectorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraphEdge" (
    "id" TEXT NOT NULL,
    "type" "EdgeType" NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GraphEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "nodeId" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "actor" TEXT NOT NULL DEFAULT 'system',
    "connectorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GraphNode_type_idx" ON "GraphNode"("type");

-- CreateIndex
CREATE INDEX "GraphNode_connectorId_idx" ON "GraphNode"("connectorId");

-- CreateIndex
CREATE INDEX "GraphEdge_fromId_idx" ON "GraphEdge"("fromId");

-- CreateIndex
CREATE INDEX "GraphEdge_toId_idx" ON "GraphEdge"("toId");

-- CreateIndex
CREATE UNIQUE INDEX "GraphEdge_fromId_toId_type_key" ON "GraphEdge"("fromId", "toId", "type");

-- CreateIndex
CREATE INDEX "Event_nodeId_idx" ON "Event"("nodeId");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE INDEX "Event_connectorId_idx" ON "Event"("connectorId");

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "GraphNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraphEdge" ADD CONSTRAINT "GraphEdge_toId_fkey" FOREIGN KEY ("toId") REFERENCES "GraphNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "GraphNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
