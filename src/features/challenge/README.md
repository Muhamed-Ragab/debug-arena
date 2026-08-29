# Challenge Feature

## Overview
Handles the core debugging challenge lifecycle: browsing published challenges, viewing detail with artifacts, and submitting solutions for grading via sandbox + AI evaluation.

## How it works
`page.tsx` (challenges, challenges/[id]) → `service.ts` (`getPublishedChallenges`, `getChallengeById`, `getUserChallengeStats`, `submitChallenge` 9-step) → `repository.ts` (`findPublished`, `findById`, `findSubmissionById`, `insertSubmission`, `findHintsByChallengeId`, `findUserChallengeStatsData`) → `db` (Drizzle `challenges`, `submissions`, `hints`). Client `ChallengeScreen` ← `useChallengeWorkspace` hook ← `submitChallengeAction` (facade).

## File map
| File | Role |
|------|------|
| `repository.ts` | Data access only, `server-only`, thin DTO mapping |
| `service.ts` | Business, DIP via repo param, `isSolved`, `calcRatingDelta`, `DIFFICULTY_LABEL` map |
| `constants.ts` | `SEED_CATEGORIES`, `DIFFICULTY_LABEL`, `STATUS_LABEL` |
| `types.ts` | ALL types (row aliases `ChallengeRow`/`HintRow`, DTOs `PublishedChallengeDTO`, `ChallengeRepository`, `RightTab`, `DiffLine`, `SubmitChallengeInput`, `UserChallengeStats`) |
| `validation.ts` | Zod `submitChallengeSchema` + `submitChallengeOutputSchema` (passthrough) |
| `schema.ts` | Drizzle `challenges`, `hints`, `submissions`, `challengeEmbeddings` |
| `utils/` | Helpers re-exported via service if >300 lines |
| `hooks/useChallengeWorkspace.ts` | Client state, validation, calls `submitChallengeAction` |
| `components/ChallengeScreen.tsx` | Pure presentational (resize via hook) |
| `actions.ts` | Facade `authActionClient.inputSchema().outputSchema()` → `challengeService.method` |
| `lib/grading.ts, ai-evaluator.ts, sandbox.ts, embedding.ts` | Pure vs side-effect separated |

## Data flow
```
page.tsx (server) → service.getPublishedChallenges() → repository.findPublished() → db.query.challenges.findMany
page.tsx → ChallengeScreen (client, pure props) ← useChallengeWorkspace → submitChallengeAction → service.submitChallenge → repository.insertSubmission → invalidateLeaderboardCache → revalidatePath
```

## SOLID notes
- **SRP**: `repository.ts` only DB, `service.ts` only business, `components` only render.
- **DIP**: service injects `challengeRepository` via param, not direct `db`.
- **OCP**: grading via `gradeSubmission` strategy, not if/else chain.
- **Pure Components**: `ChallengeScreen` receives `value/onChange/data` only; resize logic in hook.
- **Map/Switch**: `DIFFICULTY_LABEL` object map + `switch` for status branches.

## How to run/test
`pnpm test src/features/challenge/service.test.ts` (mock repo, stub sandbox/AI) — asserts `isSolved` 1 def, `submitChallenge` 9-step order.

## Conventions
- Flat `repository.ts`/`service.ts` at feature root, no `repositories/`/`services/` folders.
- `import "server-only"` in every repository.
- `createXRepository(db = db)` / `createXService(repo = xRepository)` factories, no `Impl` suffix, shorthand return, singleton-only `export const xService = createXService(xRepository)` + `xService.method`.
- `validation.ts` singular Zod-only (`*InputSchema` + `*OutputSchema` passthrough), `schema.ts` Drizzle-only, `types.ts` holds ALL types.
- Actions chain `.inputSchema().outputSchema()` via `validation.ts`.
- Use object maps for enum lookups (`DIFFICULTY_LABEL`), prefer `switch` for discriminant ≥3 branches.
- See `docs/architecture.md` for layered diagram.
