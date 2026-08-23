# Task 1 Report: Refactor Contracts Package for Schema/Type Isolation

## Status: DONE_WITH_CONCERNS

## Commits made

- `86c8696` — refactor(contracts): isolate Zod schemas into .schema.ts files

  Files changed (7): created `auth.schema.ts`, `challenges.schema.ts`,
  `submissions.schema.ts`; modified `auth.contract.ts`, `challenges.contract.ts`,
  `submissions.contract.ts`, `index.ts`.

## What was done

**Step 1 — Isolate Schemas & Types**
- `packages/contracts/src/auth.schema.ts`: `RegisterBodySchema`, `LoginBodySchema`,
  `AuthTokenResponseSchema`, `AuthErrorResponseSchema` + inferred types
  (`RegisterBody`, `LoginBody`, `AuthTokenResponse`, `AuthErrorResponse`).
- `packages/contracts/src/challenges.schema.ts`: `ChallengeSummarySchema`,
  `ChallengeDetailSchema`, `ChallengeListQuerySchema`, `ChallengeDetailPathParamsSchema`,
  `ChallengeListResponseSchema`, `ChallengeDetailErrorSchema` + inferred types.
- `packages/contracts/src/submissions.schema.ts`: `SubmitAttemptSchema`,
  `SubmissionResultSchema`, `SubmissionErrorSchema` + inferred types.

**Step 2 — Update Contracts**
- Each `.contract.ts` now imports the separated schemas and references them directly
  (no inline `z.object(...)` bodies). Existing schema names
  (`ChallengeSummarySchema`, `ChallengeDetailSchema`, `SubmitAttemptSchema`,
  `SubmissionResultSchema`) were preserved to avoid breaking existing consumers.
- Per the brief, response shapes were NOT wrapped in `{ success, data }` — they
  reflect the raw expected output as before.

**Step 3 — Re-export Types in Index**
- `index.ts` now re-exports both `.schema.ts` and `.contract.ts` modules so all
  schemas, inferred types, and contract routers are available from the package root.

## Test/Typecheck summary

- `pnpm lint` (root, turbo): **passed** — api + web report 0 warnings / 0 errors.
  (contracts and db packages have no `lint` script, so they are not linted by the
  root command; the new `.schema.ts` files follow the same style as existing code.)
- `pnpm typecheck` (root, turbo): **failed**, but NOT due to this task — see Concerns.
- Direct typecheck of `packages/contracts` via local `tsc --noEmit`: **passed**
  (exit 0, no errors). This satisfies the brief's requirement of "no type errors
  remain in packages/contracts".

## Concerns

1. **Pre-existing `tsgo` environment issue (blocks root `pnpm typecheck`).**
   The root `pnpm typecheck` fails because `@debug-arena/api` and `@debug-arena/web`
   invoke `tsgo --noEmit`, but the `tsgo` binary is not installed/available in this
   environment (`'tsgo' is not recognized as an internal or external command`). This
   is unrelated to the contracts refactor — the contracts package has no `typecheck`
   script and type-checks cleanly on its own. The api/web failure would occur on a
   clean checkout regardless of my changes. Recommend installing `tsgo` (TypeScript
   7 Go binary) or adjusting the typecheck scripts before relying on the root command.

2. **No `typecheck`/`lint` script in `@debug-arena/contracts`.**
   The package.json only declares `typescript` as a devDependency with no npm scripts.
   The brief's `pnpm typecheck --filter @debug-arena/contracts` therefore does nothing
   for this package. I verified correctness by running the local `tsc --noEmit`
   directly. Consider adding a `typecheck` script to the contracts package for CI
   coverage.

3. **`AGENTS.md` had a pre-existing uncommitted change** (a "TypeScript Strictness"
   section added). It was not part of this task and was intentionally left unstaged /
   not committed.
