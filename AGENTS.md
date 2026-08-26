# AGENTS.md

## Quick Reference

```bash
pnpm install                # install deps
docker compose up -d        # Postgres (pgvector:pg16) + Redis 7
cp .env.example .env        # fill BETTER_AUTH_SECRET, DATABASE_URL, etc.
pnpm db:generate && pnpm db:migrate  # Drizzle codegen + run migrations
pnpm dev                    # Next.js dev (Turborepo removed)
```

Verification order: `pnpm lint` -> `pnpm typecheck` -> `pnpm test` -> `pnpm build`

## Layout

| Path | Role |
|---|---|
| `src/app/` | App Router routes (public pages + `(app)` protected group) |
| `src/components/ui/` | shadcn-style primitives |
| `src/features/{name}/` | one directory per page/feature |
| `src/lib/auth.ts` | better-auth SERVER instance |
| `src/lib/auth-client.ts` | better-auth React client |
| `src/db/` | Drizzle schema + client (folded from packages/db) |
| `drizzle/` | migrations |
| `src/locales/{en,ar}/` | Lingui catalogs (.po source + compiled .ts) |

## Toolchain

- Next.js 16 App Router, src dir, Turbopack default (dev+build), React Compiler ON (`reactCompiler: true`)
- Formatter `oxfmt`, linter `oxlint` (root `.oxlintrc.json`) — Next runs NO linter during build (`next lint` removed in 16)
- TypeScript: standard `tsc --noEmit` (tsgo dropped for Next compatibility); strict mode on
- Package manager pnpm 9.9.0; Node >= 20.9

## Conventions

- Client Components: add `"use client"` when a file uses hooks/context/window/localStorage/recharts/better-auth hooks. Pure presentational files stay Server Components.
- Routing: react-router is GONE. `Link` from `next/link` (`href=`), `useRouter/usePathname/useParams/useSearchParams` from `next/navigation`.
- Auth guards: `proxy.ts` (cookie presence via `getSessionCookie`) + client `ProtectedRoute` (full session check) in `src/app/(app)/layout.tsx` chain.
- Response envelope `{ success, data, error }` applies to OUR route handlers under `src/app/api/**` (better-auth endpoints return their native shape).
- i18n: Lingui runtime pattern — `useLingui().i18n._("key")`, catalogs `src/locales/{locale}/*.json` loaded by `dynamicActivate`. No macros.
- AI instructions: read bundled version-matched docs at `node_modules/next/dist/docs/` before Next.js API work.

## TypeScript Strictness
- **NEVER use 'any' type.**
- Always set strict types for all variables, parameters, and function return types.
- Use explicit interfaces or Zod schema inference for payloads.
- No implicit 'any'; if a type is unknown, use 'unknown' and narrow it down.
