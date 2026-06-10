-- CreateEnum
CREATE TYPE "RectificationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX');

-- CreateEnum
CREATE TYPE "RectificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'RECTIFICATION_OPENED';
ALTER TYPE "EventType" ADD VALUE 'RECTIFICATION_UPDATED';
ALTER TYPE "EventType" ADD VALUE 'RECTIFICATION_RESOLVED';
ALTER TYPE "EventType" ADD VALUE 'EVIDENCE_FILED';

-- CreateTable
CREATE TABLE "Rectification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "nodeId" TEXT,
    "obligationId" TEXT,
    "dimensionId" TEXT,
    "status" "RectificationStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "RectificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "actor" TEXT NOT NULL DEFAULT 'user',
    "dueDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rectification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RectificationEvidence" (
    "id" TEXT NOT NULL,
    "rectificationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "actor" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RectificationEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rectification_nodeId_idx" ON "Rectification"("nodeId");

-- CreateIndex
CREATE INDEX "Rectification_status_idx" ON "Rectification"("status");

-- CreateIndex
CREATE INDEX "Rectification_obligationId_idx" ON "Rectification"("obligationId");

-- CreateIndex
CREATE INDEX "RectificationEvidence_rectificationId_idx" ON "RectificationEvidence"("rectificationId");

-- AddForeignKey
ALTER TABLE "RectificationEvidence" ADD CONSTRAINT "RectificationEvidence_rectificationId_fkey" FOREIGN KEY ("rectificationId") REFERENCES "Rectification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
