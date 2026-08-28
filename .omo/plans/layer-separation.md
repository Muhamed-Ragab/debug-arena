# Isolate DB + Business Logic into Repositories/Services (SOLID)

## TL;DR

> **Quick Summary**: Extract DB into `repository.ts` + business into `service.ts` (flat at feature root, 1 each), helpers to `utils/`/`lib/`. Make **all components pure** — client logic moves to hooks (`useChallengeWorkspace`, `useLeaderboard`, etc). Replace `if` chains with **object lookup maps** where suitable, prefer **switch** over `if` for discriminant unions. De-duplicate `isSolved`/`totalPoints` per-feature (shared pure predicate exception). Generate **per-feature `README.md`** via `implementation_guide` skill + update `docs/*` + `AGENTS.md` (+ `arch-wiki` if applicable).
>
> **Deliverables**:
> - `src/features/{challenge,profile,leaderboard,admin}/repository.ts` + `service.ts` (flat, 1 each) + `utils/`/`lib/` for helpers
> - **Pure components**: all `features/*/components/*.tsx` presentational, client logic in `features/*/hooks/`
> - **Mapping objects + switch**: `DIFFICULTY_MAP`, `CATEGORY_MAP`, `STATUS_MAP`, `SCORE_LEVEL_MAP` etc as objects; `switch` for `difficulty`/`status`/`category` branches
> - **Per-feature docs**: `src/features/{challenge,profile,leaderboard,admin,results,browser,auth}/README.md` via `implementation_guide` skill (how it works: repo→service→hooks→components)
> - Updated `docs/architecture.md`, `docs/erd.md`, `docs/design.md`, `AGENTS.md` (+ `docs/architecture/architecture.json` via `arch-wiki` if applicable)
> - Thin pages + slim facades; tests-after batch
>
> **Estimated Effort**: XL (18 tasks + 4 verification)
> **Parallel Execution**: YES - 4 waves + Final
> **Critical Path**: Task 1 → Task 5 → Task 15 → Task 17 → Task 18 → F1-F4

---

## Context

### Original Request
Separate all logic inside pages/components into isolated files: DB in repository.ts, business in service.ts (1 file each per feature). Check duplicates, handle once. SOLID + patterns. Then extended: make all components pure (client logic → hooks), use objects for mapping instead of if-chains, prefer switch when suitable, generate per-feature README.md via implementation_guide skill, update docs/* + AGENTS.md.

### Interview Summary
- No repo/service layer exists; `queries.ts` is data access, `actions.ts` is 9-step business logic. Agreed: functional + interfaces, no classes, 1 file per layer per feature at feature root.
- Test strategy: Tests-after. Dedup scope: per-feature keep (consolidate within feature, leave cross-feature imports but dedup predicates inside file).
- Naming locked: `{feature}/repository.ts` + `{feature}/service.ts` (+ optional `utils/`/`lib/` for helpers).

### Research Findings
- Pages thin except `results/page.tsx` (~100 lines scoring) and `challenges/*` artifact mapping duplication.
- Hotspots: `isSolved` 6+ copies, `totalPoints` 4 copies, buggyArtifact casts, profile aggregation 150 lines, leaderboard math dup.
- SOLID: SRP in actions.ts, DIP direct db/redis/ai imports, OCP grading if/else.

---

## Work Objectives

### Core Objective
Isolate DB into `repository.ts` + business into `service.ts` (flat, 1 each), make components pure (hook extraction), replace if-chains with object maps/switch, per-feature dedup, SOLID, and generate per-feature docs + update global docs/AGENTS.md.

### Concrete Deliverables
- `src/features/challenge/repository.ts` + `service.ts` (+ utils for mappers/predicates as `const DIFFICULTY_MAP` etc)
- `src/features/profile/repository.ts` + `service.ts` (+ utils)
- `src/features/leaderboard/repository.ts` + `service.ts`
- `src/features/admin/repository.ts` + `service.ts`
- `src/features/results/service.ts` (pure)
- **Pure components**: `ChallengeScreen`, `ChallengeBrowser`, `ProfileScreen`, `LeaderboardScreen`, `ResultsScreen`, `AdminQuestionsPage` etc — logic → `hooks/`; props-only rendering
- **Mapping objects + switch**: `src/lib/domain/categories.ts` / `src/features/challenge/utils/mappers.ts` use object maps (`const STATUS_LABEL: Record<Status,string> = {...}`) + `switch` for branching (e.g., `getRootCauseDesc`, `getFixQualityDesc` → map, difficulty → switch)
- **Per-feature docs**: `src/features/{challenge,profile,leaderboard,admin,results,browser}/README.md` (or `docs.md`) generated via `implementation_guide` skill — sections: Overview, How it works (repo→service→hook→component), Data flow, File map, SOLID notes
- **Global docs**: `docs/architecture.md`, `docs/erd.md`, `docs/design.md` + `AGENTS.md` updated to reflect flat repo/service + pure components + maps + switch convention
- Refactored pages via services; facades; no schema changes

### Definition of Done
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes (no `any`)
- [ ] `pnpm test` passes including new batch
- [ ] No `from "@/db/client"` in `src/app` (grep 0)
- [ ] `isSolved`/`totalPoints` defined once per service, helpers in utils if needed

### Must Have
- 1 repository.ts + 1 service.ts per feature at feature root (DIP, functional)
- Pages thin glue via service; **all components pure** (client logic in `hooks/`, components props-only, no `useState`/`useEffect` business logic inside components)
- Helpers deduped; utils/lib allowed when service >300 lines
- Results scoring removed from page into service
- **Object maps instead of if-chains** where lookup suits (STATUS_MAP, DIFFICULTY_MAP, SCORE_LEVEL_MAP); **switch** for discriminant `difficulty`/`status`/`category` branching where faster/more readable (lint: prefer switch over `if (x==='a')... else if (x==='b')`)
- **Per-feature README.md** (6+ features) via `implementation_guide` skill + global docs/AGENTS.md updated
- Transaction for multi-write; no schema changes

### Must NOT Have
- No `repositories/` or `services/` subfolders — files at `feature/` root
- No shared `src/lib/services` (per-feature keep) — exception: pure predicates `isSolved`/`totalPoints` may live once in `src/lib/domain/` or `challenge/utils/`
- No class DI
- No breaking `queries.ts`/`actions.ts` without facade
- No `any`, no `BaseRepository<T>`
- No `db` in pages/services — transaction in repository
- No impure components (no business `useState`/`fetch`/`mapping` inside `components/` — must be in hooks/service/utils)
- No `if (status==='a')...else if (status==='b')` where object map or `switch` is cleaner (enforce via lint comment: `// prefer map/switch`)
- No per-feature feature without its `README.md`; no `docs/`/`AGENTS.md` left stale after refactor

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - agent-executed only.

### Test Decision
- **Infrastructure**: YES (vitest jsdom)
- **Automated tests**: Tests-after
- **Framework**: vitest

### QA Policy
Every task has QA scenarios. Evidence `.omo/evidence/task-{N}-{slug}.{ext}`. Use Playwright for UI, Bash for lib.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (repos flat, MAX PARALLEL):
├── 1. challenge/repository.ts [quick]
├── 2. profile/repository.ts [quick]
├── 3. leaderboard/repository.ts [quick]
└── 4. admin/repository.ts [quick]

Wave 2 (services flat + utils/lib, MAX PARALLEL):
├── 5. challenge/service.ts (+ utils mappers/predicates + map/switch) [deep]
├── 6. profile/service.ts (+ utils + maps) [deep]
├── 7. leaderboard/service.ts (+ map/switch) [deep]
├── 8. admin/service.ts [deep]
└── 9. results/service.ts [deep]

Wave 3 (pages + pure components/hooks + facades):
├── 10. Refactor challenges pages via service [unspecified-high]
├── 11. Refactor results page via results/service [unspecified-high]
├── 12. Refactor profile/leaderboard/admin pages + hook dedup [unspecified-high]
├── 13. Wire queries.ts/actions.ts facades [quick]
├── 14. Tests-after batch [unspecified-high]

Wave 4 (pure components + maps/switch + docs, can parallelize partially):
├── 15. Pure components & hooks extraction (all features) [unspecified-high]
├── 16. Object maps + switch refactor (replace if-chains) [quick]
├── 17. Per-feature README.md via implementation_guide skill (6 features) [writing]
└── 18. Update docs/* + AGENTS.md (+ arch-wiki if applicable) [writing]

Wave FINAL: F1-F4 -> user okay
Critical Path: 1 → 5 → 10 → 13 → 15 → 17 → 18 → F
Max Concurrent: 4 (W1), 5 (W2), 3 (W4)
```

### Dependency Matrix
- **1-4**: None → 5-9
- **5**: 1 → 10,13,15,16
- **6**: 2 → 12,13,15,16
- **7**: 3 → 12,13,15,16
- **8**: 4 → 12,13,15,16
- **9**: 1 → 11,13,15,16
- **10**: 5 → 13,14,15,F
- **11**: 9 → 13,14,15,F
- **12**: 6,7,8 → 13,14,15,F
- **13**: 10,11,12 → 14,F
- **14**: 13 → F
- **15**: 5-12 → 16,17,F  (needs services+pages done to know component boundaries)
- **16**: 15 → 17,18,F  (maps/switch after pure extraction)
- **17**: 15,16 → 18,F
- **18**: 16,17 → F

### Agent Dispatch Summary
- **Wave 1**: quick ×4
- **Wave 2**: deep ×5
- **Wave 3**: unspecified-high ×3, quick ×1, unspecified-high ×1
- **Wave 4**: unspecified-high ×1, quick ×1, writing ×2
- **FINAL**: oracle, unspecified-high, unspecified-high, deep

---

## TODOs

- [x] 1. Challenge repository - `challenge/repository.ts` flat at feature root

  **What to do**:
  - Create `src/features/challenge/repository.ts` (single file, NOT `repositories/` folder) with `ChallengeRepository` interface + functional impl. Methods: `findPublished()` (with category+hints+submissions), `findById(id)`, `findSubmissionById(id)` (with challenge+category+user), `insertSubmission(data)`, `findHintsByChallengeId(id)`, `findUserChallengeStatsData(userId)`. Thin DTO mapping; artifact transforms deferred to service. `import "server-only"`.
  - If file approaches 300+ lines, extract pure helpers to `src/features/challenge/utils/` but re-export via repository for single import.

  **Must NOT do**:
  - Business logic, `calculateUserRank`, `revalidatePath` — not in repo
  - `repositories/` subfolder — flat `repository.ts`
  - Class `BaseRepository` — functional only

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 1 with 2-4)
  - **Blocks**: Task 5
  - **Blocked By**: None

  **References**:
  - `src/features/challenge/queries.ts:6-209` - Drizzle with: patterns to copy verbatim
  - `src/db/client.ts` - db singleton
  - `src/db/schema/index.ts` - schema barrel

  **Acceptance Criteria**:
  - [ ] `src/features/challenge/repository.ts` exists (flat), interface + all methods, no business logic
  - [ ] No `repositories/` directory created for challenge
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Flat path convention
    Tool: Bash
    Steps:
      1. `test -f src/features/challenge/repository.ts && echo ok`
      2. `test -d src/features/challenge/repositories && echo FAIL || echo ok`
    Expected Result: Flat file exists, folder does not
    Evidence: .omo/evidence/task-1-flat.txt

  Scenario: No business leak
    Tool: Bash
    Steps:
      1. `grep -rn "gradeSubmission\|runSandbox" src/features/challenge/repository.ts` → 0
    Expected Result: 0
    Evidence: .omo/evidence/task-1-no-leak.txt
  ```

  **Evidence to Capture:**
  - [ ] task-1-flat.txt, task-1-no-leak.txt

  **Commit**: YES
  - Message: `refactor(challenge): extract repository.ts flat`
  - Files: `src/features/challenge/repository.ts`

- [x] 2. Profile repository - `profile/repository.ts` flat

  **What to do**:
  - Create `src/features/profile/repository.ts` (flat) with `ProfileRepository` interface. Methods: `findByIdWithRelations(userId)`, `findByIdForSettings(userId)`, `updateUser`, `findCategoryStats`, `upsertCategoryStats`, `deleteUser`. No aggregation.

  **Must NOT do**:
  - Aggregation (radar etc) — service (Task 6)
  - `repositories/` folder
  - `calculateUserRank`

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 6
  - **Blocked By**: None

  **References**:
  - `src/features/profile/queries.ts:38-322`
  - `src/features/profile/actions.ts:12-72`

  **Acceptance Criteria**:
  - [ ] `src/features/profile/repository.ts` flat exists, no aggregation
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Flat + no aggregation
    Tool: Bash
    Steps:
      1. `test -f src/features/profile/repository.ts`
      2. `grep -rn "radarData\|avgScore" src/features/profile/repository.ts` → 0
    Expected Result: Pass
    Evidence: .omo/evidence/task-2-flat.txt
  ```

  **Evidence to Capture:**
  - [ ] task-2-flat.txt

  **Commit**: YES
  - Message: `refactor(profile): extract repository.ts flat`

- [x] 3. Leaderboard repository - `leaderboard/repository.ts` flat

  **What to do**:
  - Create `src/features/leaderboard/repository.ts` (flat) with `findAllUsersWithSubmissions`, `findAllWithCategoryStats`, `findByIdWithRelations`. Keep `cache.ts` as-is.

  **Must NOT do**:
  - Ranking math — service
  - `repositories/` folder

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 7

  **References**:
  - `src/features/leaderboard/queries.ts:77-186`
  - `src/features/leaderboard/cache.ts`

  **Acceptance Criteria**:
  - [ ] Flat file exists, 3 methods, no math
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Data-only
    Tool: Bash
    Steps:
      1. `grep -rn "buildUserLeaderboardEntry\|currentRating \* 10" src/features/leaderboard/repository.ts` → 0
    Expected Result: 0
    Evidence: .omo/evidence/task-3-dedup.txt
  ```

  **Evidence to Capture:**
  - [ ] task-3-dedup.txt

  **Commit**: YES
  - Message: `refactor(leaderboard): extract repository.ts flat`

- [x] 4. Admin repository - `admin/repository.ts` flat

  **What to do**:
  - Create `src/features/admin/repository.ts` (flat) with `findCategories`, `findChallenges`, `findChallengeById`, `insertChallenge`, `updateChallenge`, `deleteHintsByChallengeId`, `insertHints`, `upsertEmbedding`, `deleteChallengeCascade`.

  **Must NOT do**:
  - AI generation — service
  - `repositories/` folder

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 8

  **References**:
  - `src/features/admin/queries.ts:1-66`
  - `src/features/admin/actions.ts:199-356`

  **Acceptance Criteria**:
  - [ ] Flat file exists, cascade covered
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Cascade present
    Tool: Bash
    Steps:
      1. `grep -rn "delete.*hints" src/features/admin/repository.ts` → ≥1
    Expected Result: ≥1
    Evidence: .omo/evidence/task-4-cascade.txt
  ```

  **Evidence to Capture:**
  - [ ] task-4-cascade.txt

  **Commit**: YES
  - Message: `refactor(admin): extract repository.ts flat`

- [x] 5. Challenge service - `challenge/service.ts` flat + optional utils

  **What to do**:
  - Create `src/features/challenge/service.ts` (flat) with `ChallengeService` interface. Consolidate `updateUserCategoryStats`, `updateUserRatingAndStreak`, `formatLocalizationAnswer`, mappers, `getPublishedChallengesMapped`, `getChallengeByIdMapped`, `getUserChallengeStats`, `submitChallenge` 9-step orchestration. Dedup predicates: import shared `isSolved`/`calcRatingDelta`/`totalPoints` from `src/lib/domain/` or `challenge/utils/` (single source; per-feature keep exception). Inject repo via param for DIP. Transaction: service calls `challengeRepository.transaction` or `repository.withTransaction` — `db.transaction` stays inside repository (DB concern, not service). If file >300 lines, extract mappers/predicates to `src/features/challenge/utils/` and re-export via service.
  - Add pre-Wave snapshot: before refactoring, capture characterization tests of current `queries.ts`/`actions.ts` public outputs (golden JSON) to guard facade rewrite — keep alongside tests-after batch (Task 14) but run early as sanity check.

  **Must NOT do**:
  - `services/` folder — flat `service.ts`
  - Shared lib/services

  **Recommended Agent Profile**:
  - **Category**: `deep`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2)
  - **Blocks**: Tasks 10,13
  - **Blocked By**: Task 1

  **References**:
  - `src/features/challenge/actions.ts:14-286`
  - `src/features/challenge/lib/grading.ts`, `ai-evaluator.ts`, `sandbox.ts`
  - `src/features/challenge/repository.ts` (Task 1)

  **Acceptance Criteria**:
  - [ ] `src/features/challenge/service.ts` flat exists, `isSolved` 1 def, mappers present (or in utils re-exported)
  - [ ] No `services/` folder
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Flat + DIP
    Tool: Bash
    Steps:
      1. `test -f src/features/challenge/service.ts`
      2. `test -d src/features/challenge/services && echo FAIL || echo ok`
      3. `grep -c "isSolved" src/features/challenge/service.ts` → 1 def pattern
    Expected Result: Flat, deduped
    Evidence: .omo/evidence/task-5-flat.txt
  ```

  **Evidence to Capture:**
  - [ ] task-5-flat.txt

  **Commit**: YES
  - Message: `refactor(challenge): extract service.ts flat (+ utils if needed)`

- [x] 6. Profile service - `profile/service.ts` flat + optional utils

  **What to do**:
  - Create `src/features/profile/service.ts` (flat) with aggregation: `solvedChallengeIds` via `isSolved`, `totalPoints`, `profileStats`, `joinedFormatted`, `handleDisplay`, `radarData`, `categoryStats`, `strengthData`, `recentSubmissions`. `isSolved`/`calcPoints` 1 def each, utils extraction allowed if >300 lines (`profile/utils/stats.ts` etc) but service re-exports.

  **Must NOT do**:
  - `services/` folder
  - DB queries — delegate to repository.ts

  **Recommended Agent Profile**:
  - **Category**: `deep`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 12,13

  **References**:
  - `src/features/profile/queries.ts:31-250`
  - `src/features/profile/types.ts`

  **Acceptance Criteria**:
  - [ ] `src/features/profile/service.ts` flat exists, deduped helpers, no `db.query`
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Aggregation snapshot (mock repo)
    Tool: Bash
    Steps:
      1. Run `pnpm test src/features/profile/service.test.ts` stub repo → assert radar 4 entries
    Expected Result: Pass
    Evidence: .omo/evidence/task-6-agg.txt
  ```

  **Evidence to Capture:**
  - [ ] task-6-agg.txt

  **Commit**: YES
  - Message: `refactor(profile): extract service.ts flat`

- [x] 7. Leaderboard service - `leaderboard/service.ts` flat

  **What to do**:
  - Create `src/features/leaderboard/service.ts` (flat) with `isSolved` + `calcPoints` 1 def each, `buildUserLeaderboardEntry`, `calculateUserRank`, `getTopLeaderboard` orchestrating cache + repo.

  **Recommended Agent Profile**:
  - **Category**: `deep`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 12,13

  **References**:
  - `src/features/leaderboard/queries.ts:21-186`
  - `src/features/leaderboard/cache.ts`

  **Acceptance Criteria**:
  - [ ] Flat file exists, 1 `isSolved` def
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Dedup
    Tool: Bash
    Steps:
      1. `grep -c "fixCorrect ||" src/features/leaderboard/service.ts` → 1
    Expected Result: 1
    Evidence: .omo/evidence/task-7-dedup.txt
  ```

  **Evidence to Capture:**
  - [ ] task-7-dedup.txt

  **Commit**: YES

- [x] 8. Admin service - `admin/service.ts` flat

  **What to do**:
  - Create `src/features/admin/service.ts` (flat) orchestrating AI (`generateQuestionDraft`/`refineQuestionDraft`), `generateDeterministicEmbedding`, `saveChallenge`, `toggleStatus`, `deleteChallengeCascade`. Utils allowed for Zod schemas if needed (`admin/utils/validation.ts`).

  **Recommended Agent Profile**:
  - **Category**: `deep`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2

  **References**:
  - `src/features/admin/actions.ts:142-356`
  - `src/features/challenge/lib/embedding.ts`

  **Acceptance Criteria**:
  - [ ] Flat file exists
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Save orchestration mock
    Tool: Bash
    Steps:
      1. Mock repo, assert calls insertChallenge + insertHints + upsertEmbedding
    Expected Result: Order correct
    Evidence: .omo/evidence/task-8-admin.txt
  ```

  **Evidence to Capture:**
  - [ ] task-8-admin.txt

  **Commit**: YES

- [x] 9. Results service - `results/service.ts` flat (pure)

  **What to do**:
  - Create `src/features/results/service.ts` (flat) extracting `getRootCauseDesc`, `getFixQualityDesc`, `getDynamicAiFeedback`, `computeSubmissionScores` (+ `SENTENCE_SPLIT_REGEX`) from `results/page.tsx:11-150`. Pure function, takes submission data, returns view model. Helpers may go to `results/utils/` if >300 lines but re-export via service.

  **Recommended Agent Profile**:
  - **Category**: `deep`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2

  **References**:
  - `src/app/(app)/submissions/[id]/results/page.tsx:1-216`
  - `src/features/results/types.ts`

  **Acceptance Criteria**:
  - [ ] `src/features/results/service.ts` flat, no `db` import
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Pure scoring
    Tool: Bash
    Steps:
      1. Call with mock fixCorrect true → total 90+
    Expected Result: Correct
    Evidence: .omo/evidence/task-9-scoring.txt
  ```

  **Evidence to Capture:**
  - [ ] task-9-scoring.txt

  **Commit**: YES

- [x] 10. Refactor challenges pages to thin glue via challenge/service

  **What to do**:
  - `challenges/page.tsx`: replace inline mapping + `isSolved` with `challenge/service` mapped calls. Remove `drizzle-orm`.
  - `challenges/[id]/page.tsx`: replace artifact parsing with `service.getChallengeViewModel`.

  **Must NOT do**:
  - Create new repo/service — use Tasks 1+5
  - Leave `buggyArtifact` cast in page

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: NO (after services)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 13

  **References**:
  - `src/app/(app)/challenges/page.tsx:1-65`
  - `src/app/(app)/challenges/[id]/page.tsx`
  - `src/features/challenge/service.ts`

  **Acceptance Criteria**:
  - [ ] No `from "@/db/client"` in `src/app/(app)/challenges/**/*`
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: No db leak
    Tool: Bash
    Steps:
      1. `grep -rn "from \"@/db/client\"" src/app/(app)/challenges` → 0
    Expected Result: 0
    Evidence: .omo/evidence/task-10-no-db.txt
  ```

  **Evidence to Capture:**
  - [ ] task-10-no-db.txt

  **Commit**: YES

- [x] 11. Refactor results page via results/service

  **What to do**:
  - `submissions/[id]/results/page.tsx`: delete 4 helpers, call `results/service` (`compute` + `getPreventionNotes` + `getDynamicFeedback`). Keep only session + `getSubmissionById` via repo + `<ResultsScreen>`.

  **Acceptance Criteria**:
  - [ ] Page <80 lines, helpers removed
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Thin page
    Tool: Bash
    Steps:
      1. `wc -l src/app/(app)/submissions/[id]/results/page.tsx` <80
    Expected Result: <80
    Evidence: .omo/evidence/task-11-thin.txt
  ```

  **Evidence to Capture:**
  - [ ] task-11-thin.txt

  **Commit**: YES

- [x] 12. Refactor profile/leaderboard/admin pages + hook dedup

  **What to do**:
  - Ensure `profile/page.tsx`, `leaderboard/page.tsx`, `admin/questions/page.tsx` call respective `service.ts` (via queries now facades).
  - Hook dedup: consolidate `ChallengeBrowser` filter dup with `useChallengeFilters` (remove duplicate). Extract validation helpers from `useChallengeWorkspace` to `challenge/utils/` or use existing `validations.ts`.

  **Acceptance Criteria**:
  - [ ] Single filter source, validation deduped
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Hook intact
    Tool: Bash
    Steps:
      1. `pnpm test` or import check hook shape intact
    Expected Result: Pass
    Evidence: .omo/evidence/task-12-hooks.txt
  ```

  **Evidence to Capture:**
  - [ ] task-12-hooks.txt

  **Commit**: YES

- [x] 13. Wire queries.ts/actions.ts as thin facades

  **What to do**:
  - Rewrite each `queries.ts` to `export { ... } from "./repository"` or `from "./service"` preserving names. Rewrite `actions.ts` to delegate to `service.ts`. Keep Zod. No `db` leaks. Facades stay at feature root, import `./repository` / `./service` (flat path).

  **Must NOT do**:
  - Delete facades
  - Change export signatures

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 14, F

  **References**:
  - All `queries.ts` + `actions.ts`

  **Acceptance Criteria**:
  - [ ] `grep -rn "from \"@/db/client\"\|drizzle-orm" src/features/*/queries.ts src/features/*/actions.ts` → 0
  - [ ] `pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Thin facades
    Tool: Bash
    Steps:
      1. `grep -rn "from \"./service\"\|from \"./repository\"" src/features/*/queries.ts` → ≥4
    Expected Result: ≥4
    Evidence: .omo/evidence/task-13-facade.txt
  ```

  **Evidence to Capture:**
  - [ ] task-13-facade.txt

  **Commit**: YES

- [x] 14. Tests-after batch (service unit tests)

  **What to do**:
  - Add `src/features/challenge/service.test.ts`, `profile/service.test.ts`, `leaderboard/service.test.ts`, `admin/service.test.ts`, `results/service.test.ts` (5 files at feature root). Mock repository interfaces, stub sandbox/AI. Assert dedup contracts. `pnpm test src/features/*/service.test.ts`.

  **Acceptance Criteria**:
  - [ ] 5 suites pass
  - [ ] `pnpm test` passes

  **QA Scenarios**:
  ```
  Scenario: Batch passes
    Tool: Bash
    Steps:
      1. `pnpm test src/features/challenge/service.test.ts src/features/profile/service.test.ts src/features/leaderboard/service.test.ts src/features/admin/service.test.ts src/features/results/service.test.ts` → PASS
    Expected Result: PASS
    Evidence: .omo/evidence/task-14-tests.txt
  ```

  **Evidence to Capture:**
  - [ ] task-14-tests.txt

  **Commit**: YES
  - Message: `test: service batch at feature roots`

- [x] 15. Pure components & hooks extraction (all features)

  **What to do**:
  - Audit `src/features/*/components/*.tsx` + `src/components/**` — make **pure** (props-only, no `useState` business logic, no direct `fetch`/`mapping`/`calculations`). Extract state/effects/events to `src/features/{feature}/hooks/` (e.g., `useChallengeWorkspace` already, new `useChallengeBrowser`, `useProfileView`, `useLeaderboardView`, `useResultsView`, `useAdminStudio`). For `ChallengeScreen`, `ChallengeBrowser`, `ProfileScreen`, `LeaderboardScreen`, `ResultsScreen`, `AdminQuestionsPage`, move resize/selection/filter/validation logic to hooks; components receive `value`/`onChange`/`data` only.
  - For `src/app/(app)/*` client wrappers, keep server `page.tsx` thin and wrap pure component with hook-provided props.
  - Ensure hooks are co-located per feature (`features/challenge/hooks/`, `features/profile/hooks/` etc) and re-exported.

  **Must NOT do**:
  - Create `repositories/`/`services/` folders — keep flat convention
  - Leave business `if`/`map` logic inside component JSX
  - New file per component state — 1 hook per feature concern

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Cross-feature component purity audit, hook extraction, preserve UI while moving logic

  **Parallelization**:
  - **Can Run In Parallel**: YES with Task 16 (partial)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks 16,17, F
  - **Blocked By**: Tasks 5-12 (services+pages give component boundaries)

  **References**:
  - `src/features/challenge/components/ChallengeScreen.tsx:1-224` - currently has resize logic (`isDraggingLeft/Right`, window listeners) → move to `hooks/useChallengeLayout.ts`
  - `src/features/browser/components/ChallengeBrowser.tsx:12-50` - filter+pagination state → move to `hooks/useChallengeFilters` or `useChallengeBrowser`
  - `src/features/profile/components/ProfileScreen.tsx:1-92` - should stay pure (already near-pure, verify)
  - `src/features/challenge/hooks/useChallengeWorkspace.ts:36-308` - pattern to follow for extraction
  - `AGENTS.md: Conventions` - Client Components only with `"use client"` when hooks needed

  **Acceptance Criteria**:
  - [ ] No `src/features/*/components/*.tsx` contains `useState` for business data (only UI ephemeral state like `hover` allowed) — `grep -rn "useState" src/features/*/components` shows only UI state or 0 for business
  - [ ] Each client component has corresponding hook file under `features/{feature}/hooks/` exporting interface
  - [ ] `pnpm typecheck && pnpm lint` passes

  **QA Scenarios**:
  ```
  Scenario: Components are pure (no fetch/mapping)
    Tool: Bash
    Steps:
      1. `grep -rn "db\.query\|fetch(\|isSolved\|currentRating \* 10" src/features/*/components` → 0
      2. `grep -rn "useState" src/features/*/components/*.tsx | wc -l` → small (≤3 for UI only)
    Expected Result: Pure
    Evidence: .omo/evidence/task-15-pure.txt

  Scenario: Hooks provide logic
    Tool: Bash
    Steps:
      1. `ls src/features/challenge/hooks/*.ts src/features/profile/hooks/*.ts src/features/leaderboard/hooks/*.ts` → all exist
    Expected Result: Hooks present
    Evidence: .omo/evidence/task-15-hooks.txt
  ```

  **Evidence to Capture:**
  - [ ] task-15-pure.txt, task-15-hooks.txt

  **Commit**: YES
  - Message: `refactor(components): extract to pure + hooks`
  - Files: `src/features/*/components/*`, `src/features/*/hooks/*`, `src/components/**`

- [x] 16. Object maps + switch refactor (replace if-chains)

  **What to do**:
  - Replace conditional chains with **object lookup maps** where lookup suits: `const DIFFICULTY_LABEL: Record<Difficulty,string> = { easy:'Easy', medium:'Medium', hard:'Hard' }` instead of `if (d==='easy')...`, `STATUS_MAP`, `CATEGORY_MAP`, `SCORE_LEVEL_MAP` (for `getRootCauseDesc`/`getFixQualityDesc` ranges), `SENTENCE_SPLIT_REGEX` already; in `profile/service.ts` and `results/service.ts` use `SCORE_TO_DESC = { 25:'...', 15:'...' }` objects.
  - Where maps not suitable (range checks, multi-branch discriminant), use **switch** (`switch(difficulty) { case 'easy': ... case 'hard': ... default: ... }`) — specifically for `difficulty` capitalization, `status` branching in `[id]/page.tsx` guard, `category` branching in `leaderboard/service.ts`, `rootCauseScore` tiers. Verify perf: object O(1) vs if chain.
  - Update `src/lib/domain/categories.ts` (`CATEGORY_CONFIG`, `DIFFICULTY_CONFIG` already objects — keep), add missing maps in `challenge/utils/mappers.ts` or `utils/predicates.ts` if service >300 lines, re-export via service.

  **Must NOT do**:
  - Keep `if (x==='a') else if (x==='b') else if (x==='c')` for simple enum lookup — replace with map
  - Overuse switch for 2 branches — map is cleaner for 2+ equality checks
  - New folder `mappers/` — use existing `utils/`/`lib/`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Mechanical replacement, small files, fast

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 4 with 15)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks 17,18, F
  - **Blocked By**: Task 15 (needs pure boundaries to know where maps live)

  **References**:
  - `src/lib/domain/categories.ts:1-30` - already `CATEGORY_CONFIG` object map pattern to replicate
  - `src/app/(app)/challenges/[id]/page.tsx:38-39` - `difficulty.charAt(0).toUpperCase()+slice(1)` if-chain → object map `DIFFICULTY_DISPLAY`
  - `src/app/(app)/submissions/[id]/results/page.tsx:11-53` - `getRootCauseDesc`/`getFixQualityDesc` if-chains → `SCORE_LEVEL_MAP` object + maybe switch for ranges
  - `src/features/challenge/service.ts` (Task 5) - predicate `isSolved` already extracted, add `DIFFICULTY_MAP` there

  **Acceptance Criteria**:
  - [ ] No file contains `if (difficulty ===` or `if (status ===` chain of 3+ `else if` — replaced with map or switch (grep `else if.*difficulty\|else if.*status` → 0)
  - [ ] Object maps exist for at least `DIFFICULTY_LABEL`, `STATUS_LABEL`, `SCORE_LEVEL` (3 maps)
  - [ ] `switch` used for at least 2 discriminant branches (e.g., difficulty, status) — `grep -rn "switch (" src/features/*/service.ts` ≥2
  - [ ] `pnpm lint && pnpm typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Maps introduced
    Tool: Bash
    Steps:
      1. `grep -rn "DIFFICULTY_LABEL\|STATUS_MAP\|SCORE_LEVEL_MAP\|CATEGORY_MAP" src/features src/lib` → ≥3
      2. `grep -rn "else if.*===" src/features/*/service.ts | wc -l` → 0 or ≤1
    Expected Result: Maps present, if-chains gone
    Evidence: .omo/evidence/task-16-maps.txt

  Scenario: Switch present where suitable
    Tool: Bash
    Steps:
      1. `grep -rn "switch (" src/features/*/service.ts src/features/challenge/utils` → ≥2
    Expected Result: ≥2 switches
    Evidence: .omo/evidence/task-16-switch.txt
  ```

  **Evidence to Capture:**
  - [ ] task-16-maps.txt, task-16-switch.txt

  **Commit**: YES
  - Message: `refactor: use object maps + switch over if-chains`
  - Files: `src/features/*/service.ts`, `src/features/*/utils/*`, `src/lib/domain/*`, `src/app/**`

- [x] 17. Per-feature README.md via implementation_guide skill

  **What to do**:
  - For each feature dir `src/features/{challenge,profile,leaderboard,admin,results,browser,auth}` generate `<feature>/README.md` (or `docs.md`) using `implementation_guide` skill — **load skill** `skill(name="implementation-guide")` for structure. Each README must cover: **Overview** (what feature does), **How it works** (flow: `page.tsx` → `service.ts` → `repository.ts` → `db`, hook → component for client), **File map** (table: `repository.ts`, `service.ts`, `utils/`, `hooks/`, `components/`, `queries.ts` facade, `actions.ts` facade), **Data flow diagram** (ASCII or mermaid), **SOLID notes** (which pattern where: Repository, Service Layer, Pure Components, Map/Switch), **How to run/test** (`pnpm test src/features/{feature}/service.test.ts`), **Conventions** (flat `repository.ts`/`service.ts`, `import "server-only"`, pure components).
  - Generate 6-7 files in parallel; keep each concise (≤150 lines), link to global `docs/architecture.md`.

  **Must NOT do**:
  - Leave any feature without README.md
  - Copy-paste identical content — each feature tailored (challenge has grading/sandbox/AI, profile has radar/strength, leaderboard has cache/ranking, admin has AI generation+embedding, results has scoring, browser has filters)
  - Put docs in `docs/` — they live at `src/features/{feature}/README.md` per user request

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Documentation generation via implementation_guide skill, per-feature tailoring

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 4)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 18, F
  - **Blocked By**: Tasks 15,16 (need final structure to document)

  **References**:
  - Skill: `implementation_guide` — load via `skill(name="implementation-guide")` for senior-level guide structure
  - `src/features/challenge/service.ts`, `repository.ts`, `hooks/`, `components/` (final structure)
  - `docs/architecture.md` (existing) — link to
  - Template: each README uses implementation_guide sections: Feature Breakdown, Data Flow, File Structure, SOLID & Patterns, How to Extend, How to Test

  **WHY Skill Matters**:
  - `implementation_guide` gives senior-level breakdown template; `skill` load ensures consistent per-feature docs structure, not ad-hoc markdown

  **Acceptance Criteria**:
  - [ ] `src/features/challenge/README.md` exists with 7 sections above, mentions `repository.ts`/`service.ts` flat, pure components, map/switch
  - [ ] `src/features/profile/README.md` ... same (6-7 files total)
  - [ ] Each README ≤200 lines, includes file map table + mermaid/flow
  - [ ] `pnpm typecheck` still passes (docs don't break build)

  **QA Scenarios**:
  ```
  Scenario: Per-feature docs exist
    Tool: Bash
    Steps:
      1. `ls src/features/*/README.md` → ≥6 files
      2. `grep -c "How it works\|File map\|Data flow" src/features/challenge/README.md` → ≥3
      3. `grep -rn "repository.ts\|service.ts" src/features/challenge/README.md` → ≥1
    Expected Result: Docs present and tailored
    Evidence: .omo/evidence/task-17-docs.txt

  Scenario: implementation_guide skill used
    Tool: Bash
    Steps:
      1. `grep -rn "implementation_guide\|File Structure\|SOLID" src/features/*/README.md | wc -l` → ≥12
    Expected Result: Skill structure applied
    Evidence: .omo/evidence/task-17-skill.txt
  ```

  **Evidence to Capture:**
  - [ ] task-17-docs.txt, task-17-skill.txt

  **Commit**: YES
  - Message: `docs(features): per-feature README via implementation_guide`
  - Files: `src/features/*/README.md`

- [x] 18. Update global docs/* + AGENTS.md + arch-wiki if applicable

  **What to do**:
  - Update `docs/architecture.md`: new section **Layered Architecture (Flat)** — describe `feature/repository.ts` (data access only, `server-only`), `feature/service.ts` (business, DIP, transaction via repo), `feature/utils/` (mappers/maps), `feature/hooks/` (client logic, pure components), object maps + switch convention, facade `queries.ts`/`actions.ts`. Add diagram (mermaid) `page → service → repository → db` and `component ← hook ← service`.
  - Update `docs/erd.md` if ERD touches repolayer (link repository files to tables).
  - Update `docs/design.md` if UX touches pure components/hooks.
  - Update `AGENTS.md` (repo root + `~/.config/opencode/AGENTS.md` if needed): **Quick Reference** add `pnpm test src/features/*/service.test.ts`; **Layout** table add per-feature `repository.ts`/`service.ts`/`utils/`/`hooks/`/`README.md` — flat, no `repositories/`; **Conventions** add: components must be pure (logic → hooks), use object maps for enum lookups (`DIFFICULTY_MAP`), prefer `switch` over `if-else` chain for discriminant (≥3 branches), `import "server-only"` in every repository, facades re-export.
  - If `docs/architecture/architecture.json` exists (arch-wiki), run `skill(name="arch-wiki")` workflow: scan new `repository.ts`/`service.ts` endpoints, update `architecture.json`, run `build_html.py` to regenerate `architecture.html`.

  **Must NOT do**:
  - Leave docs stale — every new file type must be documented
  - Create new `docs/architecture/` if not needed — only if `arch-wiki` skill detects it
  - Break existing doc links

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: Doc updates, AGENTS.md, architecture scan

  **Parallelization**:
  - **Can Run In Parallel**: NO (after 16,17)
  - **Parallel Group**: Wave 4 (last)
  - **Blocks**: F
  - **Blocked By**: Tasks 16,17

  **References**:
  - `docs/architecture.md` (current) — add Layered Architecture section
  - `docs/erd.md` — entity ↔ repository mapping
  - `AGENTS.md` — layout + conventions sections (lines: Layout table, Conventions bullets)
  - Skill: `arch-wiki` — if `docs/architecture/architecture.json` exists, follow its scan + `build_html.py` steps

  **WHY Each Reference Matters**:
  - `AGENTS.md` is the source of truth for agents — must reflect flat `repository.ts`/`service.ts` + pure components + map/switch + `server-only` so future sessions don't regress
  - `arch-wiki` skill keeps `architecture.json`/`html` in sync with new modules/endpoints

  **Acceptance Criteria**:
  - [ ] `docs/architecture.md` contains **Layered Architecture** section + mermaid + flat path examples
  - [ ] `AGENTS.md` Layout lists `repository.ts`/`service.ts`/`utils/`/`hooks/`/`README.md` per feature, flags `repositories/` as forbidden, notes object map + switch + pure components + `server-only`
  - [ ] `pnpm typecheck` passes after doc updates
  - [ ] If `docs/architecture/architecture.json` existed, `architecture.html` regenerated (or no-op verified)

  **QA Scenarios**:
  ```
  Scenario: Global docs updated
    Tool: Bash
    Steps:
      1. `grep -rn "repository.ts\|service.ts" docs/architecture.md` → ≥2
      2. `grep -rn "repository.ts\|pure components\|object map.*switch" AGENTS.md` → ≥3
      3. `ls docs/architecture/architecture.json 2>&1 | head` — if exists, `grep -c "repository" docs/architecture/architecture.json` → ≥4
    Expected Result: Docs reflect new structure
    Evidence: .omo/evidence/task-18-docs.txt

  Scenario: AGENTS.md still valid
    Tool: Bash
    Steps:
      1. `pnpm typecheck` → 0
      2. `grep -c "server-only" AGENTS.md` → ≥1
    Expected Result: Pass
    Evidence: .omo/evidence/task-18-agents.txt
  ```

  **Evidence to Capture:**
  - [ ] task-18-docs.txt, task-18-agents.txt

  **Commit**: YES
  - Message: `docs: update architecture/erd/agents for flat repo/service + pure + maps`
  - Files: `docs/architecture.md`, `docs/erd.md`, `docs/design.md`, `AGENTS.md`, `docs/architecture/architecture.json` (if updated)

---

## Final Verification Wave

> 4 parallel reviews, ALL must APPROVE, then user okay.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Verify path convention `feature/repository.ts` + `feature/service.ts` (not repositories/), no `db` in pages/services, predicates deduped, utils only for helpers, evidence exists. `Must Have [N/N] | VERDICT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  `pnpm typecheck && pnpm lint && pnpm test`. Check `as any`, console.log, unused imports, BaseRepository slop. `Build PASS/FAIL | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Run every QA scenario, cross-task integration, edge cases. Evidence `.omo/evidence/final-qa/`. `Scenarios N/N | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  Diff vs plan: 1:1, no creep, no `repositories/` folder, no extra shared lib. `Tasks N/N | VERDICT`

---

## Commit Strategy
- **Wave 1 (4)**: `refactor(challenge): extract repository.ts` etc
- **Wave 2 (5)**: `refactor(challenge): extract service.ts` etc
- **Wave 3 (3)**: `refactor(app): thin pages` + `refactor(features): facades` + `test: batch`
- **Wave 4 (4)**: `refactor(components): pure + hooks` + `refactor: maps+switch` + `docs(features): README` + `docs: global + AGENTS.md`
- **Pre-commit**: `pnpm lint && pnpm typecheck && pnpm test`

---

## Success Criteria

### Verification Commands
```bash
pnpm lint
pnpm typecheck
pnpm test
grep -r "from \"@/db/client\"" src/app | wc -l  # 0
grep -rn "from \"@/db/client\"" src/features/*/service.ts | wc -l  # 0 (only repository.ts may import db)
ls src/features/challenge/repository.ts src/features/challenge/service.ts src/features/profile/repository.ts src/features/profile/service.ts src/features/leaderboard/repository.ts src/features/leaderboard/service.ts src/features/admin/repository.ts src/features/admin/service.ts src/features/results/service.ts # all exist
test -d src/features/challenge/repositories && echo "FAIL repositories folder exists" || echo "OK flat"
grep -rn "useState" src/features/*/components/*.tsx | wc -l  # small (pure)
grep -rn "DIFFICULTY_LABEL\|STATUS_MAP" src/features src/lib | wc -l  # ≥3 maps
grep -rn "switch (" src/features/*/service.ts | wc -l  # ≥2 switches
ls src/features/*/README.md | wc -l  # ≥6 per-feature docs
grep -rn "repository.ts\|service.ts" AGENTS.md | wc -l  # ≥3
pnpm build
```

### Final Checklist
- [ ] 4 repository.ts + 5 service.ts flat at feature roots, no `repositories/`/`services/` folders
- [ ] All components pure (hooks extracted), maps + switch applied
- [ ] ≥6 per-feature README.md via implementation_guide + docs/* + AGENTS.md updated
- [ ] All Must Have present, Must NOT Have absent
- [ ] Tests pass + evidence in `.omo/evidence/`
- [ ] Thin facades, utils only for helpers, no `db` leak

