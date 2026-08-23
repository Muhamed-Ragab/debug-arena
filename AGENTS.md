# AGENTS.md

## Quick Reference

```bash
pnpm install                    # install all workspace deps
docker compose up -d            # Postgres (pgvector:pg16) + Redis 7
cp .env.example .env            # fill JWT_SECRET, ANTHROPIC_API_KEY, etc.
pnpm db:generate && pnpm db:migrate  # Drizzle codegen + run migrations
pnpm dev                        # API (port 3000) + Web (port 5173) via Turborepo
```

Single-package commands:
```bash
pnpm --filter @debug-arena/api dev       # API only
pnpm --filter @debug-arena/web dev       # Web only
pnpm --filter @debug-arena/db studio     # Drizzle Studio
pnpm --filter @debug-arena/web i18n:extract  # Extract i18n strings
pnpm --filter @debug-arena/web i18n:compile  # Compile i18n catalogs
```

Verification order: `pnpm lint` -> `pnpm typecheck` -> `pnpm build`

## Monorepo Layout

| Package | Name | Role |
|---|---|---|
| `apps/api` | `@debug-arena/api` | NestJS backend (port 3000) |
| `apps/web` | `@debug-arena/web` | React + Vite frontend (port 5173) |
| `packages/db` | `@debug-arena/db` | Drizzle schema, client, migrations |
| `packages/contracts` | `@debug-arena/contracts` | ts-rest API contracts + Zod schemas |

Dependency flow: `api` -> `db`, `contracts`. `web` -> `contracts`. Never import `db` from `web`.

## Toolchain (Non-Default Choices)

- **TypeScript 7.0.2** — typecheck uses `tsgo --noEmit` (not `tsc`)
- **Formatter**: `oxfmt` (not Prettier) — config at `.oxfmtrc.json`. Double quotes, trailing commas, 100 char width
- **Linter**: `oxlint` (not ESLint) — per-app config at `apps/{api,web}/.oxlintrc.json`
- **Package manager**: pnpm 9.9.0 — workspaces in `pnpm-workspace.yaml`
- **Node**: >= 20

## API (`apps/api`)

- NestJS 10 with `experimentalDecorators` + `emitDecoratorMetadata` enabled
- `reflect-metadata` must be imported before anything else (see `main.ts`)
- Module pattern: `src/modules/{name}/{name}.{module,controller,service}.ts`
- Modules: `auth`, `challenges`, `submissions`, `grading`, `bug-injection`, `sandbox`, `jobs`
- tsconfig uses `module: "NodeNext"` / `moduleResolution: "NodeNext"`
- All service files are stubs with `TODO` markers referencing `docs/architecture.md` sections

## Web (`apps/web`)

- React 19 + Vite 8 + Tailwind CSS v4 (PostCSS plugin `@tailwindcss/postcss`, no `tailwind.config`)
- Routing: react-router-dom v7 (flat `<Routes>` in `App.tsx`)
- Data fetching: TanStack Query + `@ts-rest/react-query`
- i18n: Lingui v6 — locales `en` + `ar`, catalogs at `src/locales/{locale}/messages`
- UI components: custom components in `src/components/ui/` (shadcn-style, not a library import)
- Feature organization: `src/features/{name}/` — one directory per page/feature
- Vite proxy: `/api/*` -> `http://localhost:3000` (strips `/api` prefix)
- Theme: `ThemeProvider` with dark mode default (`src/contexts/ThemeContext`)
- Icons: `lucide-react`
- Charts: `recharts`

## Database (`packages/db`)

- Drizzle ORM with `node-postgres` driver (`pg` package)
- Schema: `packages/db/src/schema.ts` — single source of truth for all tables
- pgvector: 1536-dimension embeddings (text-embedding-3-small), HNSW indexes
- Separate `analytics` Postgres schema for `user_category_stats` and `leaderboard_entries`
- RLS policies defined inline in Drizzle schema (admin/user roles via `pgPolicy`)
- DB roles `admin` and `user` expected to exist at DB level (`.existing()`)
- Migration runner: `tsx src/migrate.ts` (not drizzle-kit push)
- Config: `packages/db/drizzle.config.ts` — outputs to `packages/db/drizzle/`
- Default connection: `postgresql://postgres:postgres@localhost:5432/debug_arena`

## Contracts (`packages/contracts`)

- ts-rest contracts with Zod validation schemas
- Contract files: `auth.contract.ts`, `challenges.contract.ts`, `submissions.contract.ts`
- Barrel export from `src/index.ts`

## Infrastructure

- Docker Compose: `pgvector/pgvector:pg16` (port 5432), `redis:7-alpine` (port 6379)
- BullMQ uses Redis for job queuing (grading, bug-injection)
- AI: Vercel AI SDK with Anthropic (bug-injection agent, grading agent, adaptive hints)
- Sandbox: Docker-based code runner (`SANDBOX_IMAGE=debug-arena-sandbox:latest`)

## Project Status

Scaffold phase — all module/service files contain `TODO` stubs. No tests exist yet. No CI pipeline. Design references live in `templates/` (Figma exports + demo app).

## Documentation (`docs/`)

**Read these before implementing any feature.** Service stubs reference doc sections by name (e.g. `architecture.md §3`).

| File | What it covers | When to consult |
|---|---|---|
| `architecture.md` | System diagram, component responsibilities (frontend, API, data layer, job queue), AI agent orchestration, sandbox isolation model | Any new module, cross-layer integration, or infrastructure change |
| `erd.md` | Full entity definitions with field types, FK relationships, and notes for all tables (users, oauth_accounts, sessions, challenges, submissions, hints, categories, stats, leaderboard, notifications, social graph, gamification) | Any schema change or new query — check field names/types here first |
| `design.md` | UX principles, screen-by-screen design notes (landing, challenge browser, challenge screen, results, profile, leaderboard), dark dev-tool aesthetic, component behavior specs | Any frontend page or component work |
| `plan.md` | 4-phase roadmap (Foundation → Manual MVP → Gamification/Social → Scale Content → Differentiated Modes), sequencing rationale, open questions | Scoping work, understanding what belongs in which phase |
| `tasks.md` | Phase 0 + Phase 1 task checklist with concrete items for content, backend, frontend, AI agents, and QA | Picking up next work item, tracking progress |
| `implementation_guide.md` | Senior-level technical breakdown for: rate limiting (`@nestjs/throttler` + Redis), pagination (offset vs cursor strategies with Drizzle code), SSE notifications + email fallback, gamification engine (streaks + achievements), async submission + sandbox flow, Auth via better-auth (DB sessions, google+github OAuth, RLS bridge); session guards detailed in `implementation_guide.md §6`, pgvector RAG grading pipeline, email templates | **Primary reference when implementing any feature** — has exact function signatures, execution flows, and code patterns |
| `API.md` | Full endpoint reference: paths, methods, request/response shapes, rate limits per endpoint, pagination strategy per endpoint (offset vs cursor), global response envelope `{ success, data, error, meta }` | Implementing any controller or frontend API integration |

### Key cross-doc patterns

- **Response envelope**: All API responses use `{ success, data, error, meta }` — see `API.md`
- **Pagination**: Offset for browseable lists (`/challenges`, `/leaderboard`), cursor for feeds (`/notifications`, `/recent-submissions`) — strategies detailed in `implementation_guide.md §2`, endpoint mapping in `API.md`
- **Async grading flow**: Submission → sandbox test run (sync) → BullMQ grading job (async) → SSE push on completion — full trace in `implementation_guide.md §5`, architecture context in `architecture.md §2.4`
- **Auth guards**: `BetterAuthSessionGuard` (requires auth), `OptionalBetterAuthSessionGuard` (passes anonymous), `RolesGuard` (admin-only) — detailed in `implementation_guide.md §6`
- **Rate limits**: Per-endpoint limits defined in `API.md`, implementation approach in `implementation_guide.md §1`

## TypeScript Strictness
- **NEVER use 'any' type.**
- Always set strict types for all variables, parameters, and function return values.
- Use explicit interfaces or Zod schema inference for payloads.
- No implicit 'any'; if a type is unknown, use 'unknown' and narrow it down.
