/**
 * Seed — bootstraps minimal reference data.
 * Real graph nodes are populated by the normalization service (Phase 2).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed two Jurisdiction nodes that the normalizer will reference
  const jurisdictions = [
    { id: "jurisdiction::US", label: "United States", region: "US" },
    { id: "jurisdiction::EU", label: "European Union", region: "EU" },
    { id: "jurisdiction::IN", label: "India", region: "IN" },
  ];

  for (const j of jurisdictions) {
    await prisma.graphNode.upsert({
      where: { id: j.id },
      create: {
        id: j.id,
        type: "JURISDICTION",
        label: j.label,
        attributes: { region: j.region },
        confidence: "HIGH",
        source: "MANUAL",
      },
      update: { label: j.label },
    });
  }

  console.log(`Seeded ${jurisdictions.length} jurisdiction nodes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
