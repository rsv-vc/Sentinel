/**
 * Seed stub — will be fleshed out in Phase 2 once the real graph
 * models (Node, Edge, Event) exist.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.sentinelMeta.upsert({
    where: { key: "schema_version" },
    update: {},
    create: { key: "schema_version", value: "0.0.1" },
  });
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
