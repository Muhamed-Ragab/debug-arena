# AGENTS.md

> ⚠️ COMPACTION DIRECTIVE: This file + `RULES.md` are MANDATORY and MUST be preserved verbatim during context compaction. After compaction, re-read both files at `AGENTS.md` and `RULES.md` before proceeding. Canonical agent rules live in `RULES.md` — all agents MUST read and follow `RULES.md` on every session, no exceptions.

> Canonical: `RULES.md` — Mandatory agent rules, always followed. Quick Reference below is summary; `RULES.md` is normative.

## Quick Reference

```bash
pnpm install                # pnpm 9.9.0, Node >= 20.9
docker compose up -d        # Postgres pgvector:pg16 (5432) + Redis 7 (6379)
cp .env.example .env        # fill BETTER_AUTH_SECRET, DATABASE_URL, GROQ_API_KEY, etc.
pnpm db:generate && pnpm db:migrate  # Drizzle codegen -> ./drizzle + migrate (creates pgvector extension)
pnpm db:seed                # optional seed
pnpm dev                    # runs `lingui compile` then `next dev` (Turbopack)
```

Verification order: `pnpm lint` -> `pnpm format:check` -> `pnpm typecheck` -> `pnpm test` -> `pnpm build` (also `pnpm test src/features/*/service.test.ts` for service batch)

## Commands

- `pnpm build` — `lingui compile --typescript && next build` (Turbopack). Must compile catalogs first.
- `pnpm lint` — `biome check src` (extends `ultracite/biome/{core,react,next,vitest}`, ignores `.next/dist/drizzle/src/locales/**/messages.*`). Fix: `pnpm lint:fix` or `pnpm lint:sort` (unsafe sort).
- `pnpm format` / `pnpm format:check` — `biome format --write src` / `biome format src`
- `pnpm typecheck` — `tsc --noEmit` (strict, `bundler` resolution, `paths: {"@/*": ["./src/*"]}`)
- `pnpm test` — `vitest run` (jsdom, `src/**/*.test.{ts,tsx}`, setup `src/test/setup.ts`). Single test: `pnpm vitest run src/path/file.test.ts` or `pnpm test -- src/path/file.test.ts`. Watch: `pnpm test:watch`.
- `pnpm test:e2e:bruno` — `bru run bruno --env local` (requires running app + DB/Redis).
- `pnpm i18n:extract` / `pnpm i18n:compile` — `lingui extract --clean` / `lingui compile --typescript`. Run `i18n:compile` before dev/build if `src/locales/**/messages.ts` missing.
- `pnpm db:generate` — `drizzle-kit generate` (config `drizzle.config.ts`: schema `./src/db/schema/index.ts` -> out `./drizzle`, dialect `postgresql`). `pnpm db:migrate` uses `tsx --env-file=.env src/db/migrate.ts` — env file flag matters, not `dotenv/config` alone. Prod variants: `pnpm db:migrate:prod` / `pnpm db:seed:prod` read `.env.prod`.

## Layout

| Path | Role |
|---|---|
| `src/app/` | App Router routes (`(app)` protected group + `(auth)` + `api/`) |
| `src/features/{name}/` | One directory per page/feature (`admin`, `auth`, `browser`, `challenge`, `leaderboard`, `profile`, `results`, `landing`) — own `schema.ts` if DB-backed; each has flat `repository.ts` (DB only, `server-only`) + `service.ts` (business, DIP via repo param) + `constants.ts` (data) + `types.ts` (interfaces) + `utils/`/`hooks/`/`README.md` if needed (no `repositories/`/`services/` subfolders) |
| `src/components/ui/` | shadcn primitives on Base UI (`@base-ui/react`) |
| `src/components/{shared,layout,preferences}` | Cross-feature markdown/badges, Sidebar/TopBar, lang/theme toggles |
| `src/lib/auth/` | better-auth server (`index.ts`) + React client (`client.ts`) |
| `src/lib/env/` | `@t3-oss/env-nextjs` schema (`env.ts`) — defaults allow dev without `.env` but DB/Redis will fail |
| `src/lib/safe-action/` | `next-safe-action` clients: `actionClient`, `authActionClient`, `adminActionClient` |
| `src/lib/redis/` | `getRedis()` singleton (ioredis, globalThis cache, silent in test) |
| `src/lib/domain/` | Category/difficulty enums and domain types |
| `src/db/schema/` | Barrel `index.ts` re-exports `features/*/schema` + `relations.ts` + `roles.ts`; Drizzle array syntax `(t) => [...]` |
| `src/db/client.ts` | `drizzle(pool, {schema})` with globalThis pool reuse outside production |
| `drizzle/` | Generated migrations (Biome-ignored) |
| `src/locales/{en,ar}/` | Lingui catalogs (`.po` source + compiled `.ts`, Biome-ignored) |
| `src/test/` | `setup.ts` (jest-dom + cleanup) + `server-only-shim.ts` |

## Toolchain

- Next.js 16 App Router, `src/` dir, Turbopack dev+build, `reactCompiler: true` + `typedRoutes: true` (`next.config.ts`)
- Tailwind CSS v4 + `tw-animate-css`, `shadcn` CLI
- Biome 2.5.10 via ultracite presets — no ESLint/Prettier
- Drizzle ORM 0.45.2 + drizzle-kit 0.31.1 + `pg` + `pgvector/pgvector:pg16`
- better-auth 1.7.1 + `@better-auth/drizzle-adapter` + `@better-auth/redis-storage` (ioredis)
- Vercel AI SDK (`ai` + `@ai-sdk/groq`) for bug-injection/grading
- Single app — Turborepo removed. No `opencode.json`, no `.opencode/`, no CI workflows, no Husky/lint-staged.

## Conventions

- Client Components: add `"use client"` only when using hooks/context/window/localStorage/recharts/better-auth hooks. Presentational stays Server Component.
- Routing: `Link` from `next/link`, `useRouter/usePathname/useParams/useSearchParams` from `next/navigation`. `typedRoutes: true` — use typed `href` values.
- Auth guards: `src/proxy.ts` (not `middleware.ts` — Next 16 `proxy` convention) checks `getSessionCookie(request)` for `PROTECTED_PREFIXES` + `AUTH_ROUTES`; client `ProtectedRoute` in `src/app/(app)/layout.tsx` does full session check. Matcher list in `proxy.ts` `config.matcher`.
- Server Actions: import `actionClient` / `authActionClient` / `adminActionClient` from `@/lib/safe-action` with Zod schemas. `ActionError` surfaces as user-facing message; other errors are sanitized.
- API envelope `{ success, data, error }` applies only to `src/app/api/**` handlers — better-auth endpoints at `/api/auth/**` return their native shape.
- i18n: `useLingui().i18n._("key")` + `dynamicActivate` loading `src/locales/{locale}/messages.ts`. No Lingui macros. `lingui.config.ts`: `sourceLocale: en`, `locales: [en, ar]`, `compileNamespace: es`, `format: @lingui/format-po`.
- Env: `src/lib/env/env.ts` via `createEnv` — server keys (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `REDIS_URL`, `GROQ_API_KEY`, `GOOGLE_*`, `GITHUB_*`) default for dev; `emptyStringAsUndefined: true`. Never read `process.env` directly.
- Drizzle: schema split by feature, re-exported from `src/db/schema/index.ts`. Migrations via `drizzle.config.ts`. `src/db/migrate.ts` runs `CREATE EXTENSION IF NOT EXISTS vector` before `migrate()`.
- Layered Architecture (Flat): `feature/repository.ts` (data access only, `server-only`, thin DTO mapping) → `feature/service.ts` (business, DIP via `repository` param, `calcPoints`/`isSolved` deduped, `DIFFICULTY_LABEL` maps) → `feature/hooks/` (client logic) → `feature/components/` (pure, props-only, no `useState` business logic). `feature/constants.ts` holds data, `feature/types.ts` holds interfaces. Facades `feature/queries.ts`/`actions.ts` re-export from `./repository`/`./service`.
- Pure Components: all `features/*/components/*.tsx` presentational, client logic in `features/*/hooks/`; use object maps (`DIFFICULTY_LABEL`, `STATUS_LABEL`, `SCORE_LEVEL_MAP`) instead of `if (x==='a')...else if`, prefer `switch` for discriminant unions (`switch(difficulty)`, `switch(status)`) where ≥3 branches.
- Redis: call `getRedis()` — handles `ECONNREFUSED` warning when Docker down.
- Vitest: `vitest.config.ts` aliases `@ -> src` and `server-only -> src/test/server-only-shim.ts` (jsdom lacks `react-server` export condition). `include: ["src/**/*.test.{ts,tsx}"]`, `environment: jsdom`.

## TypeScript Strictness

- **NEVER use `any`.** Strict mode on; `noEmit: true`. Use explicit interfaces or Zod inference; unknown + narrowing if type unclear.
- Path alias `@/*` -> `./src/*` (both `tsconfig.json` and `vitest.config.ts`).
- Layered files: `repository.ts` + `service.ts` flat at `feature/` root, `server-only` in repository, facades re-export.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
