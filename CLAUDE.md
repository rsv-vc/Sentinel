# CLAUDE.md — Sentinel (local prototype)

## What this is
Sentinel is an independent, continuous system of record for enterprise AI risk. This
repo is a **local vertical-slice prototype**, not the production platform. It demonstrates:

> connect a mocked source → normalize into a graph → assess risk & compliance → show a
> coverage score → export a board report.

Buyer persona: **CRO / CISO of a large regulated enterprise.**

---

## Non-negotiable principles (enforce with tests)

1. **Independence** — no selling/brokering compute, tools, or insurance; no risk-transfer
   features anywhere; we "rectify, not transfer."
2. **Continuous, not point-in-time** — data comes from (simulated) telemetry; manual entry
   is the flagged exception.
3. **Evidenced, not complete** — always compute and disclose a coverage score + blind spots,
   including in exports.
4. **Read-only, least-privilege** — the Connector interface has NO write methods; the
   product never writes to customer systems.
5. **Frame, don't adjudicate** — compliance output is "obligations and gaps" with an
   effective date, never a legal verdict.

---

## Stack

TypeScript monorepo (npm workspaces). Packages:

| Package | Role |
|---------|------|
| `packages/db` | Prisma + Postgres; will model the graph as Node/Edge tables + append-only Event table |
| `packages/connectors` | Read-only Connector interface + mock implementations |
| `packages/core` | Normalization, risk & compliance engine, rectification, exports |
| `packages/api` | Express app, routes, background sync worker |
| `packages/web` | Next.js 14 App Router (inventory, dependency graph, dashboard, reports) |

Services run via **docker-compose** (Postgres now; Neo4j only if graph traversal demands it — keep
graph access behind a repository layer so it can be swapped without touching the rest of the system).

Ports: `api` → 3001, `web` → 3000, `postgres` → 5432.

---

## Working agreement

- Propose a short plan and **wait for approval** before non-trivial code.
- Small slices; after each, give exact run commands and a "done when you can see X".
- Tests alongside features, especially for the five principles above.
- Conventional commits; one green checkpoint = one commit.
- **Update the "Current state / next slice" section below at the end of every phase.**

---

## Architecture notes

*(Expand as the system grows.)*

**Graph model (planned, Phase 2):**
Node types: `UseCase`, `Asset`, `Vendor`, `DataAsset`, `Jurisdiction`.
Edges are typed and directional. All mutations append an Event (no destructive updates).
Graph access is behind a repository interface (`IGraphRepository`) so the backing store
can be swapped from Postgres to Neo4j later.

**Connector interface (Phase 1):**
- Strictly read-only — zero write/create/delete methods by design.
- Each connector reports: `listAssets`, `listModelDeployments`, `listIdentityGrants`, `listEgressEvents`.
- A connector registry tracks: `connectorId`, `lastSyncAt`, `status`, `scope`.
- Principle 4 enforced by a test that inspects the interface for write methods.

**Coverage score (Phase 3):**
Ratio of estate nodes observed via live telemetry vs. manually attested, plus an
enumerated list of known blind spots. Never claims completeness.

---

## Current state / next slice

- **Phase completed:** Phase 1 — Connector interface + MockCloudConnector + Registry
- **Next unbuilt slice:** Phase 2 — Graph schema (Node/Edge/Event tables) + normalization service
- **Known issues / TODOs:**
  - `packages/db` seed uses `SentinelMeta` placeholder; replace with real graph models in Phase 2.
  - No auth yet (Phase 8).
  - `packages/web` has no Tailwind — will add when UI phases begin (Phase 3).

## Connector interface (as-built, Phase 1)

**Location:** `packages/connectors/src/`

**`IConnector`** (`types.ts`) — read-only interface, four list methods:
- `listAssets()` → `Asset[]` — GPU instances, compute, storage; each with region + monthly cost
- `listModelDeployments()` → `ModelDeployment[]` — provider, modelId, region, cost, use-case labels
- `listIdentityGrants()` → `IdentityGrant[]` — principal, kind, resource, grant level, source (telemetry|manual)
- `listEgressEvents()` → `EgressEvent[]` — source, destination, direction, bytes, jurisdiction

**`MockCloudConnector`** (`mock/MockCloudConnector.ts`) — deterministic estate:
- 5 assets: 2 GPU (us-east-1, eu-west-1), 1 compute, 2 S3 buckets
- 2 model deployments: GPT-4o (OpenAI, us-east-1, $22.4k/mo), Claude 3.5 Sonnet (Anthropic, eu-west-1, $9.8k/mo)
- 6 identity grants including 1 manual grant and 1 overly-broad contractor grant
- 8 egress events including cross-border and a suspicious unknown-analytics.io destination

**`ConnectorRegistry`** (`ConnectorRegistry.ts`) — register/deregister connectors, track scope/status/lastSyncAt.

**Principle 4 tests:** `connector-readonly.test.ts` — pattern-matches all method names against write verbs;
any violation fails CI. Add new connectors to `CONNECTORS_UNDER_TEST` when implemented.
