# AGENTS.md

## Quick Reference

```bash
pnpm install                # install deps
docker compose up -d        # Postgres (pgvector:pg16) + Redis 7
cp .env.example .env        # fill BETTER_AUTH_SECRET, DATABASE_URL, etc.
pnpm db:generate && pnpm db:migrate  # Drizzle codegen + run migrations
pnpm dev                    # Next.js dev (Turborepo removed)
```

Verification order: `pnpm lint` -> `pnpm format:check` -> `pnpm typecheck` -> `pnpm test` -> `pnpm build`

## Layout

| Path | Role |
|---|---|
| `src/app/` | App Router routes (public pages + `(app)` protected group) |
| `src/components/ui/` | shadcn-style primitives |
| `src/features/{name}/` | one directory per page/feature |
| `src/lib/auth/` | better-auth SERVER & React client instances |
| `src/lib/env/` | `@t3-oss/env-nextjs` type-safe environment configuration |
| `src/lib/safe-action/` | `next-safe-action` base & authenticated action clients |
| `src/lib/redis/` | Redis client singleton |
| `src/lib/domain/` | Categories, difficulties, and domain types |
| `src/db/schema/` | Drizzle schema split by domain with array syntax `(t) => [...]` |
| `src/db/client.ts` | Drizzle pool client |
| `drizzle/` | migrations |
| `src/locales/{en,ar}/` | Lingui catalogs (.po source + compiled .ts) |

## Toolchain

- Next.js 16 App Router, src dir, Turbopack default (dev+build), React Compiler ON (`reactCompiler: true`)
- Linter & Formatter: **Biome** (`biome.json`) — `pnpm lint` (`biome check src`) and `pnpm format` (`biome format --write src`)
- Server Actions: **next-safe-action** (`src/lib/safe-action/`)
- Environment Validation: **@t3-oss/env-nextjs** (`src/lib/env/`)
- TypeScript: standard `tsc --noEmit`; strict mode on
- Package manager pnpm 9.9.0; Node >= 20.9

## Conventions

- Client Components: add `"use client"` when a file uses hooks/context/window/localStorage/recharts/better-auth hooks. Pure presentational files stay Server Components.
- Routing: `Link` from `next/link` (`href=`), `useRouter/usePathname/useParams/useSearchParams` from `next/navigation`.
- Auth guards: `src/proxy.ts` (cookie presence via `getSessionCookie`) + client `ProtectedRoute` (full session check) in `src/app/(app)/layout.tsx` chain.
- Server Actions: use `actionClient` or `authActionClient` from `@/lib/safe-action` with Zod input schemas.
- Response envelope `{ success, data, error }` applies to OUR route handlers under `src/app/api/**` (better-auth endpoints return their native shape).
- i18n: Lingui runtime pattern — `useLingui().i18n._("key")`, catalogs `src/locales/{locale}/*.json` loaded by `dynamicActivate`. No macros.
- AI instructions: read bundled version-matched docs at `node_modules/next/dist/docs/` before Next.js API work.

## TypeScript Strictness
- **NEVER use 'any' type.**
- Always set strict types for all variables, parameters, and function return types.
- Use explicit interfaces or Zod schema inference for payloads.
- No implicit 'any'; if a type is unknown, use 'unknown' and narrow it down.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
