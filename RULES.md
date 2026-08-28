# RULES.md — MANDATORY AGENT RULES — MUST SURVIVE COMPACTION

> ⚠️ COMPACTION DIRECTIVE: These rules are MANDATORY and MUST be preserved verbatim during context compaction. If you are summarizing or compressing, keep this file's content intact — do not paraphrase, shorten, or drop sections. After compaction: if any rule below feels unclear, re-read `RULES.md` before proceeding. `AGENTS.md` references this file as canonical.

## 0. Meta — How Agents Must Use This File
- On session start, read `RULES.md` (and `AGENTS.md`) before any other file.
- Before any response, check available skills — if a relevant skill applies (even 1% chance), load it first.
- Never skip skill checks for "simple questions" or "just one small change".
- Re-read this file after context compaction.
- When you make a decision, save it to memory if the memory tool is available.

## 1. Universal (all projects)
- **Language: English only.** All responses, code comments, and docs in English. Never switch languages mid-conversation.
- **No secrets in commits, logs, or messages.** Never commit `.env`, API keys, tokens, or secrets. Scan with `envsitter-guard` before committing if available.
- **Ask before guessing.** When unsure about intent, scope, or file location — ask ONE clarifying question instead of assuming.
- **Follow existing patterns.** Match the project's conventions, not your defaults.

## 2. Project — Debug Arena (this repo)
### 2.1 Stack (do not deviate)
- Next.js 16 App Router (`src/` dir, Turbopack, `reactCompiler: true`, `typedRoutes: true`) + Tailwind v4 + Base UI + Biome 2.5.10 (ultracite) + Drizzle 0.45.2 + pgvector + better-auth + Vercel AI SDK (Groq). See `AGENTS.md` Toolchain.

### 2.2 Commands (use pnpm 9.9.0, Node >= 20.9)
- `pnpm lint` / `pnpm lint:fix` — `biome check src`
- `pnpm format` / `pnpm format:check` — `biome format`
- `pnpm typecheck` — `tsc --noEmit` (strict, `bundler` resolution, `@/*` -> `./src/*`)
- `pnpm test` — `vitest run` (jsdom, `src/**/*.test.{ts,tsx}`, alias `server-only` -> `src/test/server-only-shim.ts`). Single: `pnpm vitest run src/path/file.test.ts`
- `pnpm build` — `lingui compile --typescript && next build` (must compile catalogs first)
- `pnpm db:generate` / `pnpm db:migrate` (uses `tsx --env-file=.env src/db/migrate.ts` — env file flag matters) / `pnpm db:seed`
- `pnpm i18n:extract` / `pnpm i18n:compile`
- Verification order: `pnpm lint` -> `pnpm format:check` -> `pnpm typecheck` -> `pnpm test` -> `pnpm build` (also `pnpm test src/features/*/service.test.ts`)

### 2.3 Layout (do not invent folders)
- `src/app/` — App Router (`(app)` protected + `(auth)` + `api/`)
- `src/features/{name}/` — one flat directory per feature (`admin`, `auth`, `browser`, `challenge`, `leaderboard`, `profile`, `results`, `landing`): each has `repository.ts` + `service.ts` + `constants.ts` + `types.ts` + `README.md` + `hooks/`/`utils/` if needed. **Never** `repositories/` or `services/` subfolders.
- `src/components/ui/` — shadcn on Base UI; `src/components/{shared,layout,preferences}` — cross-feature
- `src/lib/{auth,env,safe-action,redis,domain}` — as in AGENTS.md
- `src/db/schema/index.ts` — barrel re-exports `features/*/schema` + `relations.ts` + `roles.ts`
- `drizzle/` — generated migrations (Biome-ignored); `src/locales/{en,ar}/` — Lingui catalogs

### 2.4 Layered Architecture (Flat) — MANDATORY
- `feature/repository.ts` — data access ONLY, `import "server-only"`, thin DTO mapping, no business logic, no `any`, functional (no class). Drizzle array syntax `(t) => [...]`.
- `feature/service.ts` — business ONLY, DIP via `repository` param (injected), deduped `isSolved`/`calcPoints`/`calcRatingDelta`, object maps (`DIFFICULTY_LABEL`, `STATUS_LABEL`, `SCORE_LEVEL_MAP`) instead of `if/else if`, `switch` for ≥3 branches.
- `feature/hooks/` — client logic only (`useChallengeFilters`, `useChallengeWorkspace`, etc.). Components do `filtered = useChallengeFilters(challenges)`.
- `feature/components/*.tsx` — **pure**, props-only, `"use client"` only when using hooks/context/window. No business `useState`; only UI ephemeral state (hover, pagination `page`). No `db` or scoring calls.
- `feature/constants.ts` — data/constants only. `feature/types.ts` — interfaces/types only.
- Facades `feature/queries.ts` / `actions.ts` — **thin**, re-export from `./repository`/`./service` (explicit `async` delegation, NOT `export { } from`), **must not** `import { db } from "@/db/client"` or `from "@/db/client"`. Neither should services.
- Tests: `feature/service.test.ts` covers pure business; components have `*.test.tsx`.

### 2.5 Conventions
- Client Components: `"use client"` only for hooks/context/window/localStorage/recharts/better-auth hooks. Keep presentational as Server Components.
- Routing: `Link` from `next/link`, `useRouter/usePathname/useParams/useSearchParams` from `next/navigation` (`typedRoutes: true` — typed `href`).
- Auth guards: `src/proxy.ts` (NOT `middleware.ts`) checks `getSessionCookie(request)` for `PROTECTED_PREFIXES` + `AUTH_ROUTES`; `ProtectedRoute` in `src/app/(app)/layout.tsx`. Matcher in `proxy.ts` `config.matcher`.
- Server Actions: `actionClient` / `authActionClient` / `adminActionClient` from `@/lib/safe-action` with Zod schemas. `ActionError` surfaces; others sanitized.
- API envelope `{ success, data, error }` only for `src/app/api/**` — better-auth at `/api/auth/**` native.
- i18n: `useLingui().i18n._("key")` + `dynamicActivate` loading `src/locales/{locale}/messages.ts`. No Lingui macros. `sourceLocale: en`, `locales: [en, ar]`, `compileNamespace: es`, `format: @lingui/format-po`.
- Env: `src/lib/env/env.ts` via `createEnv` (`emptyStringAsUndefined: true`). Never read `process.env` directly. Defaults allow dev but DB/Redis fail without Docker.
- Drizzle: `CREATE EXTENSION IF NOT EXISTS vector` before `migrate()`.
- Redis: `getRedis()` singleton (ioredis, globalThis cache, silent in test).
- Vitest aliases: `@ -> src`, `server-only -> src/test/server-only-shim.ts`.

### 2.6 TypeScript Strictness — HARD BLOCKS
- **NEVER `any`.** Strict mode, `noEmit: true`. Use explicit interfaces, Zod inference, `unknown` + narrowing.
- **NEVER** `as any`, `@ts-ignore`, `@ts-expect-error`, empty `catch(e) {}`.
- **NEVER** suppress type errors to make build pass — fix the type.
- **NEVER** leave code in broken state after 3 failed fixes — revert, document, consult Oracle, ask user.
- Path alias `@/*` -> `./src/*` (both `tsconfig.json` and `vitest.config.ts`).

### 2.7 Verification & Evidence — BEFORE "done"
A task is NOT complete without evidence:
- File edit → `lsp_diagnostics` clean on changed files
- Build command → exit 0 (`pnpm typecheck`, `pnpm lint`)
- Test run → pass (or note pre-existing failures explicitly)
- Delegation → agent result received and verified
- For layered tasks: `grep -r 'from "@/db/client"' src/app src/features/*/service.ts src/features/*/queries.ts src/features/*/actions.ts` must be 0; `repository.ts`/`service.ts` flat at feature root; no `repositories/` folder

### 2.8 Workflow & Delegation (Orchestrator = Atlas/Sisyphus)
- On every message: **Skill check first** (1% rule). If a skill applies, load it before implementation.
- Classify intent before acting: trivial → direct tools; exploratory → `explore` (background, 1-3) + tools in parallel; open-ended → assess codebase (disciplined/transitional/legacy/greenfield) then propose; ambiguous → ask ONE question.
- Turn-local intent reset: reclassify from CURRENT message only; never auto-carry "implementation mode"; do not create todos unless user explicitly asks to implement.
- Context-completion gate: implement only when (1) explicit verb (implement/add/create/fix/change/write), (2) concrete scope, (3) no blocking specialist pending (especially Oracle).
- **Decompose & delegate:** Any implementation with 2+ independent units → spawn `deep`/`unspecified-high` agents in **parallel** (`run_in_background=true`), one goal + one deliverable per call, 5+ line prompts with GOAL / EXPECTED OUTCOME / REQUIRED TOOLS / MUST DO / MUST NOT DO / CONTEXT. Your value is orchestration, not direct edits. Resume via `task(task_id="ses_...")`, collect via `background_output(task_id="bg_...")` only after `<system-reminder>`.
- **Anti-duplication:** Once explore/librarian delegated, do NOT re-grep the same topic yourself. Wait for notification.
- **Explore/Librarian = grep, not consultants.** Free/cheap, always `run_in_background=true`, always parallel. Continue only non-overlapping work.
- **Oracle = expensive, read-only.** Consult for complex architecture, after 2+ failed fixes, after significant work, or multi-system tradeoffs. Never cancel Oracle, never deliver final answer before collecting Oracle result.
- **Plan dependency:** Multi-step task → consult Plan agent first. Single-file fix → proceed directly.
- **Todo discipline:** Multi-step → `todowrite` immediately with atomic todos `"[WHERE] [HOW] to [WHY] - expect [RESULT]"`, 1 `in_progress` at a time, mark `completed` immediately, split if >3 tool calls.
- **Delegation prompt structure (all 6 sections mandatory):** TASK / EXPECTED OUTCOME / REQUIRED TOOLS / MUST DO / MUST NOT DO / CONTEXT.
- **Verification before completion:** Run `lsp_diagnostics` on changed files at end of logical unit, before marking todo done, before reporting completion. If project has build/test, run them.
- **Failure recovery:** After 3 consecutive failures → STOP, REVERT to last working state, DOCUMENT attempts, CONSULT Oracle, ASK USER.
- **Commits:** Never commit unless explicitly requested. When requested: atomic commits, inspect `git status/diff/log --oneline -10`, never commit secrets, conventional commits, subject ≤50 chars. Never `background_cancel(all=true)`, always individual. Never deliver final answer before collecting Oracle.

### 2.9 File Operations
- Prefer `ctx_*` tools (lean-ctx) over native `Read/Grep/Shell/Glob` when available. `ctx_read` with mode `signatures` for orientation, `full` before edit, `diff` after edit.
- Never use native `Read` when `ctx_read` exists — self-correct.
- Use `.opencode` codemaps, `ctx_compose` for orientation.

## 3. Completion Checklist (every task)
- [ ] Todos marked done, diagnostics clean, build passes, user's request fully addressed
- [ ] Per-task evidence files under `.omo/evidence/` if plan requires
- [ ] No pre-existing lint/type errors introduced (report as "pre-existing" if found)
- [ ] If Oracle running: end response and wait for notification first; cancel disposable background tasks individually via `background_cancel(taskId="...")`

## 4. Where These Rules Live
- Canonical: `RULES.md` (this file) — agents read this first.
- `AGENTS.md` — Quick Reference + Commands + Layout + Toolchain + Conventions (references RULES.md).
- Global: `~/.config/opencode/AGENTS.md` — survives compaction, re-read after compaction.
- `docs/architecture.md` / `docs/erd.md` / `docs/design.md` — system design layers.

## 5. Enforcement
- Any agent that violates a HARD BLOCK must revert and fix minimally.
- Any "done" claim without evidence is treated as NOT done.
- When in doubt about a rule, re-read `RULES.md` — do not guess.
