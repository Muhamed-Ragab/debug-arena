# Free AI and Scoring Cleanup Implementation Plan

> **For agentic workers:** Execute the tasks inline in this checkout; preserve pre-existing working-tree edits and do not commit them.

**Goal:** Keep Debug Arena free of payment integrations, remove unused pgvector infrastructure, make challenge points and leaderboard filters consistent, and document future user-configured AI providers.

**Architecture:** Award points from a challenge's configured maximum and best graded attempt, with a stable one-per-challenge total. Keep current Groq-backed server AI behavior for this change and replace pseudo-vector fallback grading with deterministic token overlap. Remove persisted vector schema/infrastructure and describe a future encrypted BYOK provider/model/key and usage-limit feature in the roadmap.

**Tech Stack:** Next.js 16, TypeScript, Drizzle ORM, Postgres, Vercel AI SDK, Vitest, Biome, pnpm.

**Spec:** User request in the 2026-09-30 conversation.

## Global Constraints

- Preserve existing user changes in the shared working tree.
- Keep the current application free; do not add payment packages or payment endpoints.
- Do not add a vector search service or vector schema where no query exists.
- AI provider settings, user API-key storage, and per-user usage quotas are roadmap work only.
- Keep score totals in the 0–100 grading scale and challenge point maxima at 100/200/300 by default.

---

### Task 1: Define and test points behavior

**Files:**
- Modify: `src/lib/domain/scoring.ts`
- Modify: `src/lib/domain/scoring.test.ts`
- Modify: `src/features/profile/service.ts`
- Modify: `src/features/profile/service.test.ts`
- Modify: `src/features/leaderboard/service.ts`
- Modify: `src/features/leaderboard/service.test.ts`
- Modify: `src/features/leaderboard/repository.ts`
- Modify: `src/features/leaderboard/types.ts`
- Modify: `src/features/profile/types.ts`
- Modify: `src/features/profile/components/RecentSubmissions.tsx`

- [x] Add failing tests for difficulty-weighted awards, score bounds, best-attempt deduplication, weekly filtering, and category filtering.
- [x] Implement shared pure score helpers and use them in profile and leaderboard results.
- [x] Show earned points over the challenge maximum in recent submissions.
- [x] Connect leaderboard tabs to a validated authenticated server action and the selected period/category.
- [x] Run the focused scoring and leaderboard tests.

### Task 2: Remove unused vector storage and pseudo-embeddings

**Files:**
- Modify: `src/features/challenge/schema.ts`, `src/db/schema/roles.ts`, `src/db/schema/relations.ts`
- Modify: `src/features/challenge/lib/ai-evaluator.ts`, `src/features/challenge/lib/grading.ts`
- Modify: `src/features/admin/service.ts`, `src/features/admin/repository.ts`, `src/features/admin/types.ts`
- Modify: `src/db/seed.ts`, `src/db/migrate.ts`, `docker-compose.yml`
- Delete: `src/features/challenge/lib/embedding.ts`
- Create: a Drizzle migration dropping the unused vector table, columns, and indexes

- [x] Add fallback-grading tests that distinguish exact terms from unrelated text and empty input.
- [x] Remove vector writes, columns, indexes, and extension bootstrap; retain the existing LLM grading path.
- [x] Generate and inspect the migration; preserve the shared `vector` extension itself if another database consumer uses it.
- [x] Run focused evaluator/grading tests and schema/type checks.

### Task 3: Correct docs and document the next iteration

**Files:**
- Modify: `README.md`, `docs/architecture.md`, `docs/erd.md`, `docs/plan.md`, `docs/tasks.md`, `docs/implementation_guide.md`

- [x] Replace stale NestJS/Vite/Lingui/pgvector descriptions with the current Next.js/next-intl/Groq implementation.
- [x] State that the current app has no payment flow and is free to use.
- [x] Add a BYOK roadmap item for AI SDK-supported providers, provider/model selection, encrypted API keys, server-only execution, and enforceable usage quotas.
- [x] Confirm package changes are necessary and compatible before updating any dependency.

### Task 4: Verify the requested behaviors

- [x] Run points, profile, leaderboard, evaluator, and grading tests.
- [x] Run `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `pnpm i18n:lint` for changed code/docs where applicable.
- [x] Review the final diff to ensure no pre-existing changes were reverted and no payment integration was introduced.
