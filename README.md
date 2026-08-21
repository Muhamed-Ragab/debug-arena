# Debug Arena (working title)

A "LeetCode for debugging" platform — challenges test root-cause bug diagnosis
(React rendering bugs, backend concurrency/singleton issues, etc.) instead of
writing new code from scratch. See `docs/` for the full spec.

## Docs
- [`docs/erd.md`](docs/erd.md) — data model
- [`docs/architecture.md`](docs/architecture.md) — system design
- [`docs/design.md`](docs/design.md) — UX/product design
- [`docs/plan.md`](docs/plan.md) — phased roadmap
- [`docs/tasks.md`](docs/tasks.md) — Phase 0/1 task checklist

## Stack
- **Monorepo**: pnpm + Turborepo
- **API**: NestJS, ts-rest contracts, Drizzle ORM
- **DB**: Postgres + pgvector (single instance for relational data + embeddings — no separate vector DB)
- **Jobs**: BullMQ + Redis
- **AI**: Vercel AI SDK (bug-injection agent, grading agent, adaptive hints)
- **Frontend**: React + Vite + Tailwind + shadcn/ui

## Structure
```
apps/
  api/           NestJS backend (modules: auth, challenges, submissions, grading, bug-injection, sandbox, jobs)
  web/           React frontend (pages: browser, challenge, results, profile, leaderboard)
packages/
  db/            Drizzle schema + client (pgvector columns on challenges/submissions)
  contracts/     ts-rest shared API contracts (auth, challenges, submissions)
docs/            Planning docs (erd, architecture, design, plan, tasks)
docker-compose.yml   Local Postgres (pgvector image) + Redis
```

## Getting started (once you resume)
1. `pnpm install`
2. `docker compose up -d` — starts Postgres (pgvector) + Redis
3. `cp .env.example .env` and fill in secrets (JWT_SECRET, ANTHROPIC_API_KEY, etc.)
4. `pnpm db:generate && pnpm db:migrate` — generate + run Drizzle migrations
5. `pnpm dev` — runs API + web via Turborepo

## Status
Scaffold only — module/service files are stubs with `TODO`s marking exactly
where logic needs to be filled in, cross-referenced to the relevant doc
section (e.g. `submissions.service.ts` points at `architecture.md §3`).
Next up per `docs/plan.md`: Phase 0 foundation tasks in `docs/tasks.md`.
