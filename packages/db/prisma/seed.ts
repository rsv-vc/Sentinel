/**
 * Seed — Phase 8.
 *
 * Creates three demo users, one per role.
 * Run with:  npm run db:seed   (from repo root or packages/db)
 *
 * Credentials printed to stdout so the developer can see them.
 * NEVER use these passwords in production.
 */

import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const db = new PrismaClient();

const DEMO_USERS = [
  { email: "admin@sentinel.local",   name: "Admin User",    role: "ADMIN"   as const, password: "sentinel-admin-2024"   },
  { email: "analyst@sentinel.local", name: "Analyst User",  role: "ANALYST" as const, password: "sentinel-analyst-2024" },
  { email: "viewer@sentinel.local",  name: "Viewer User",   role: "VIEWER"  as const, password: "sentinel-viewer-2024"  },
];

async function main() {
  console.log("\n[seed] Creating demo users…");

  for (const u of DEMO_USERS) {
    const user = await db.user.upsert({
      where:  { email: u.email },
      update: { passwordHash: hashSync(u.password, 10), name: u.name, role: u.role },
      create: { email: u.email, name: u.name, role: u.role, passwordHash: hashSync(u.password, 10) },
    });
    console.log(`  ✓ ${user.role.padEnd(8)} ${user.email}   password: ${u.password}`);
  }

  console.log("\n[seed] Done.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
