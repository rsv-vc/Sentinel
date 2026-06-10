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

- **Phase completed:** Phase 9 — Demo-ready dashboard
- **Next unbuilt slice:** Further polish or new features as needed
- **Known issues / TODOs:**
  - Migration must be run manually (`npm run db:migrate`) after `docker:up` — no auto-migrate on startup yet.
  - No auth yet (Phase 8).

## Auth & RBAC (as-built, Phase 8)

**DB addition:** `User` model — id, email, passwordHash (bcrypt), name, role (ADMIN|ANALYST|VIEWER), timestamps. Migration: `phase8_auth`.

**Demo users** (seeded via `npm run seed` in `packages/db`):
| Role    | Email                     | Password                  |
|---------|---------------------------|---------------------------|
| ADMIN   | admin@sentinel.local      | sentinel-admin-2024       |
| ANALYST | analyst@sentinel.local    | sentinel-analyst-2024     |
| VIEWER  | viewer@sentinel.local     | sentinel-viewer-2024      |

**`packages/api/src/auth/`**
- `jwt.ts` — `signToken` / `verifyToken`, 8h expiry, secret from `JWT_SECRET` env
- `middleware.ts` — `requireAuth` (401 on missing/invalid token), `requireRole(...roles)` (403)
- Token read from `sentinel_token` httpOnly cookie **or** `Authorization: Bearer` header

**API routes:**
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/login` | Public — returns JWT in cookie + body |
| GET  | `/api/auth/me`    | requireAuth |
| POST | `/api/auth/logout`| Public — clears cookie |

**Role enforcement on existing routes:**
- All `/api/*` routes: `requireAuth` (any valid role)
- `/api/sync`, `/api/rectifications`: `requireRole("ADMIN", "ANALYST")`

**Web (Phase 8):**
- `src/middleware.ts` — Next.js edge middleware; redirects to `/login` if `sentinel_token` cookie missing/invalid. Uses `jose` (edge-compatible).
- `/login` page — full-screen, no Nav, demo credentials hint, `LoginForm` client component
- `Nav` — reads JWT cookie server-side via `cookies()`, renders `UserChip` (role pill + email + sign-out button) or "Local prototype" tag
- `UserChip` client component — calls `POST /api/auth/logout` then redirects to `/login`
- `packages/web/.env.local` — `JWT_SECRET` (must match API)
- CORS updated to `credentials: true`; `apiFetch` updated to `credentials: "include"`

## Rectification workflow (as-built, Phase 7)

**DB schema additions:**
- `Rectification` — id, title, description, nodeId?, obligationId?, dimensionId?, status (OPEN|IN_PROGRESS|RESOLVED|WONT_FIX), priority (LOW|MEDIUM|HIGH|CRITICAL), actor, dueDate?, resolvedAt?, timestamps
- `RectificationEvidence` — id, rectificationId, content, actor, createdAt (append-only — no update/delete)
- `EventType` extended with: RECTIFICATION_OPENED, RECTIFICATION_UPDATED, RECTIFICATION_RESOLVED, EVIDENCE_FILED
- Migration: `20260603090119_phase7_rectification`

**`packages/db/src/`**
- `IRectificationRepository` — create, get, list, update, resolve, fileEvidence, listEvidence (no deleteEvidence — append-only)
- `PrismaRectificationRepository` — concrete implementation

**API routes (Phase 7):**
| Method | Path | Description |
|--------|------|-------------|
| POST   | `/api/rectifications` | Open a new rectification |
| GET    | `/api/rectifications` | List (filter ?nodeId, ?status, ?obligationId) |
| GET    | `/api/rectifications/:id` | Get with evidence |
| PATCH  | `/api/rectifications/:id` | Update title/description/priority/status/dueDate |
| POST   | `/api/rectifications/:id/resolve` | Mark resolved (writes resolvedAt) |
| POST   | `/api/rectifications/:id/evidence` | File evidence (append-only) |
| GET    | `/api/rectifications/:id/evidence` | List evidence |

**Web (Phase 7):**
- `RectificationPanel` client component — new form, status transitions (OPEN → IN_PROGRESS → RESOLVED / WONT_FIX), evidence filing, evidence trail display, closed items in collapsible `<details>`
- `/rectifications` overview page — KPI row (Open/In Progress/Resolved/Won't Fix counts)
- Use-case detail page (`/use-cases/[id]`) — Rectifications card with panel, pre-linked to nodeId
- "Rectify" added to main Nav

## Board report export (as-built, Phase 6)

**`packages/core/src/reports/BoardReportBuilder`**
- Assembles `BoardReport` from: CoverageCalculator + RiskEngine (all use-cases) + ComplianceEngine (all use-cases)
- Three sections: `coverage` (always with `disclaimer` + `blindSpots`), `risk` (per-use-case summaries + concentration flags), `compliance` (top gaps sorted by affected use-case count)
- `meta` includes `generatedAt`, `dataAsOf`, `totalSyncRuns`, `sentinelVersion`

**`packages/api/src/reports/`**
- `pdf.renderer.ts` — `pdfkit`-based PDF, A4, covers all three sections, prints Principle 5 disclaimer before compliance section
- `csv.renderer.ts` — multi-section CSV, Excel/Sheets compatible, all fields labeled

**API routes (Phase 6):**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reports/board` | Full BoardReport JSON |
| GET | `/api/reports/board.csv` | CSV download (filename includes date) |
| GET | `/api/reports/board.pdf` | PDF download (filename includes date) |

**Web (Phase 6):**
- `/reports` page: meta row, Coverage section (score + blind spots + disclaimer), Risk section (KPI row, concentration flags, use-case table), Compliance section (disclaimer first, top gaps)
- "Report" added to main Nav
- Two download buttons link directly to `/api/reports/board.csv` and `/api/reports/board.pdf`

## Risk & Compliance engine (as-built, Phase 5)

**`packages/core/src/risk/`**
- `RiskEngine` — scores each UseCase across 5 dimensions: vendor, contractual, data, modelBehaviour, resilience
- `modelBehaviour` is always `UN_ASSESSED` unless an asset has an `evalStatus` attribute (never auto-"passed")
- Portfolio report: `portfolioReport()` → vendor concentration flags (≥40 % of use-cases = flagged)
- Residual = worst dimension; UN_ASSESSED propagates to residual

**`packages/core/src/compliance/`**
- `ComplianceEngine.assessUseCase()` → `UseCaseComplianceReport`
- Versioned rule-sets in `rules.ts`: GDPR v1.1.0 (eff. 2024-01-01), EU AI Act v1.0.0 (eff. 2025-08-01), DPDP v1.0.0 (eff. 2024-01-01)
- Obligations triggered by jurisdiction, data asset presence, model presence, cross-border transfer
- `GapStatus`: `GAP | PARTIAL | EVIDENCED` — only upgrades to EVIDENCED when affirmative graph evidence is present
- Principle 5 disclaimer always present on every report

**API routes (Phase 5):**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/use-cases/:id/risk` | Risk report (5 dimensions + residual) |
| GET | `/api/use-cases/:id/compliance` | Compliance obligations & gap analysis |
| GET | `/api/risk/portfolio` | Portfolio concentration + summary |

**Web (Phase 5):**
- Use-case detail page (`/use-cases/[id]`) now shows Risk Assessment card + Compliance Obligations card
- Residual risk pill in the title area
- Compliance card shows context flags (cross-border, personal data, model), obligation list with gap status, and the mandatory Principle 5 disclaimer

## Graph model (as-built, Phase 2)

**Prisma schema:** `packages/db/prisma/schema.prisma`

Node types: `USE_CASE`, `ASSET` (includes model deployments), `VENDOR`, `DATA_ASSET`, `JURISDICTION`
Edge types: `USES_ASSET`, `USES_MODEL`, `OWNED_BY_VENDOR`, `STORES_DATA`, `SUBJECT_TO`, `HAS_GRANT`, `EGRESSES_TO`
Confidence levels: `HIGH` (telemetry, unambiguous), `MEDIUM` (inferred), `LOW` (manual / ambiguous — requires confirmation)

**Event table** is append-only. Types: `NODE_CREATED`, `NODE_UPDATED`, `NODE_FLAGGED_LOW_CONFIDENCE`, `NODE_CONFIRMED`, `EDGE_CREATED`, `EDGE_REMOVED`, `SYNC_COMPLETED`. No deletes or updates ever.

**`IGraphRepository`** (`packages/db/src/graph.repository.interface.ts`) — swap Postgres → Neo4j here without touching core/api.
**`PrismaGraphRepository`** — concrete implementation.

## Normalization service (as-built, Phase 2)

**`NormalizationService`** (`packages/core/src/normalization.service.ts`):
- Reads all four connector data types in parallel
- Derives deterministic node IDs via FNV-1a hash (`deterministic-id.ts`)
- Correlation: models → UseCases via `useCaseLabels`; assets → UseCases via `tags.project`
- Confidence: HIGH (tagged), MEDIUM (some context / inferred), LOW (untagged — shadow AI candidate)
- Low-confidence nodes get a `NODE_FLAGGED_LOW_CONFIDENCE` event for human confirmation
- Writes `SYNC_COMPLETED` event as an evidence-trail boundary marker

## API routes (as-built, Phase 2)

Base path: `/api`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/use-cases` | List all UseCase nodes |
| GET | `/use-cases/:id/graph` | UseCase subgraph (root + neighbours + edges) |
| GET | `/nodes/:id/history` | Append-only event history for any node |
| GET | `/graph/recent-events?limit=N` | Most recent N events across all nodes |
| GET | `/connectors` | Registry status for all connectors |
| POST | `/sync` | Trigger on-demand normalization (dev helper) |

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
