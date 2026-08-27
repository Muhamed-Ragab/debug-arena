# Debug Arena (working title)

A "LeetCode for debugging" platform — challenges test root-cause bug diagnosis
(React rendering bugs, backend concurrency/singleton issues, etc.) instead of
writing new code from scratch. See `docs/` for the full spec.

## Docs
- `docs/erd.md` — data model
- `docs/architecture.md` — system design
- `docs/design.md` — UX/product design
- `docs/plan.md` — phased roadmap
- `docs/tasks.md` — task checklist

## Stack
- **Framework**: Next.js 16 (App Router, `src/` dir, Turbopack for dev + build, React Compiler enabled)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui primitives (built on Base UI)
- **Forms / Server Actions**: `next-safe-action` with Zod input schemas
- **Environment**: `@t3-oss/env-nextjs` type-safe env validation
- **Auth**: better-auth (server + React client; admin role + RLS claim bridge)
- **ORM / DB**: Drizzle ORM on Postgres + pgvector (single instance for relational data + embeddings)
- **Cache / Sessions**: Redis 7 (better-auth redis storage)
- **i18n**: Lingui (English + Arabic), runtime `dynamicActivate` catalogs
- **AI**: Vercel AI SDK (bug-injection agent, grading agent, adaptive hints)
- **Tooling**: Biome (lint + format), pnpm 9.9.0, Node >= 20.9

## Structure
```
src/
  app/                 App Router routes (public pages + (app) protected group)
  components/
    ui/                shadcn-style primitives (Base UI)
    shared/            Cross-feature components (markdown, badges, medals…)
    preferences/       Language switcher, theme toggle
    layout/            Sidebar, TopBar
  features/{name}/     One directory per page/feature (admin, auth, browser,
                       challenge, leaderboard, profile, results)
  lib/
    auth/              better-auth server + React client instances
    env/               @t3-oss/env-nextjs configuration
    safe-action/       next-safe-action base & authenticated clients
    redis/             Redis client singleton
    domain/            Categories, difficulties, domain types
  db/
    schema/            Drizzle schema split by domain
    client.ts          Drizzle pool client
  locales/{en,ar}/     Lingui catalogs (.po source + compiled .ts)
drizzle/               Migrations
docker-compose.yml     Local Postgres (pgvector:pg16) + Redis 7
```

## Getting started
1. `pnpm install`
2. `docker compose up -d` — starts Postgres (pgvector:pg16) + Redis 7
3. `cp .env.example .env` and fill in secrets (`BETTER_AUTH_SECRET`, `DATABASE_URL`, etc.)
4. `pnpm db:generate && pnpm db:migrate` — generate + run Drizzle migrations
5. `pnpm dev` — starts the Next.js dev server (Turbopack)

## Verification order
`pnpm lint` → `pnpm format:check` → `pnpm typecheck` → `pnpm test` → `pnpm build`

## Status
Active development on a single Next.js application (Turborepo removed). Core
phases landed: auth, challenge browser, AI grading, profile, leaderboard, and
the admin challenge studio. See `docs/plan.md` for the roadmap.
