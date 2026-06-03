# Sentinel — Local Prototype

> Independent, continuous system of record for enterprise AI risk.
> **Local vertical-slice prototype** — not the production platform.

## Prerequisites

| Tool | Version |
|------|---------|
| Node | ≥ 20 (see `.nvmrc`) |
| npm | ≥ 10 |
| Docker Desktop | any recent |

## Quick start

```bash
# 1. Start Postgres
npm run docker:up

# 2. Install all workspace dependencies (first time only)
npm install

# 3. Generate Prisma client + run first migration
npm run db:migrate   # choose a migration name, e.g. "init"

# 4. Seed (optional)
npm run db:seed

# 5. Start api (port 3001) + web (port 3000)
npm run dev
```

Open **http://localhost:3000** — you should see **API status: ok** with a green dot.

## Workspace packages

| Package | Description |
|---------|-------------|
| `packages/db` | Prisma schema + client + migrations |
| `packages/connectors` | Read-only Connector interface + mock impls (Phase 1) |
| `packages/core` | Normalization, risk engine, exports (Phase 2+) |
| `packages/api` | Express API + background sync worker |
| `packages/web` | Next.js 14 App Router UI |

## Other scripts

```bash
npm run docker:down   # stop Postgres
npm run db:studio     # Prisma Studio on :5555
npm run lint          # ESLint
npm run format        # Prettier
npm test              # Jest (all packages)
```
