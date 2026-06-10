import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Delete everything that came from the mock connector so we get a clean slate
  const nodes = await prisma.graphNode.findMany({
    where: { connectorId: "mock-cloud-connector-v1" },
    select: { id: true },
  });
  const ids = nodes.map(n => n.id);
  console.log(`Found ${ids.length} nodes from mock connector`);

  for (let i = 0; i < 5; i++) {
    const r = await prisma.graphEdge.deleteMany({
      where: { OR: [{ fromId: { in: ids } }, { toId: { in: ids } }] },
    });
    console.log(`Edge pass ${i+1}: ${r.count} deleted`);
    if (r.count === 0) break;
  }

  await prisma.event.deleteMany({ where: { nodeId: { in: ids } } });
  const r = await prisma.graphNode.deleteMany({ where: { id: { in: ids } } });
  console.log(`Deleted ${r.count} nodes. Done.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
