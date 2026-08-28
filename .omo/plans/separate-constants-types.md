# Separate Constants & Types From Logic Files

## TL;DR

> **Quick Summary**: Extract inline constant variables and type/interface definitions out of logic-containing files into dedicated `constants.ts` / `types.ts` files, following the project's existing separation convention (`src/lib/domain` + per-feature files).
>
> **Deliverables**:
> - 8 dedicated files (7 tasks; T4 produces two) holding previously-inline constants/types
> - Cleaned import sites across ~20 files (including 2 test files)
> - Zero behavior change; current runtime values preserved
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 7 tasks in a single Wave 1
> **Critical Path**: T1 → (all parallel) → Verification Wave

---

## Context

### Original Request
User: "create constans files for constants vairables and types files for types instead set them in any file includes logic serprate them" — i.e. stop colocating constant variables and type definitions inside logic files; put them in dedicated `constants.ts` / `types.ts` files.

### Interview Summary
**Key Decisions** (user chose recommended options):
- **1A — Scope**: Extract ONLY shared (used in 2+ files) constants/types, duplication hotspots, and colocated Zod-inferred types. Local-only inline items stay put.
- **2A — Location**: Extend `src/lib/domain` (shared) + per-feature `constants.ts`/`types.ts`. Do NOT create a global `src/lib/constants`.
- **3A — Props**: Keep the 36 local component `Props` interfaces inline (standard React/TS practice).
- **4A — Inconsistencies**: Relocate only; do NOT change values. Flag mismatches as follow-ups.

### Research Findings (3 explore agents)
- Project already has a separation convention: `src/lib/domain/{categories,types,index}.ts` (shared constants+types home), per-feature `types.ts` for profile/results/leaderboard/challenge, and only `features/profile/constants.ts` as an existing constants file.
- Naming: `types.ts` / `constants.ts` (no dot suffix); named exports only; `@/` alias for cross-module; relative `./` intra-feature; `index.ts` barrels where present.
- `tsconfig.json` has `isolatedModules: true` → all type re-exports MUST use `export type`.
- Many inline constants/types exist; ~100+ inline types, ~15 inline constants. Most are local-only (out of scope per 1A).
- Vitest present (`src/test/vitest.d.ts`, `*.test.ts(x)`); verification via `pnpm typecheck`, `pnpm lint`, `pnpm test`.

### Metis Review (applied)
- **Dropped 5 single-file moves** violating 1A: `supportedProviders`, `PROMPT_PRESETS`, `RawParsedChallenge`, `ChallengeFilters`(type), admin `DiffLine`.
- **Do NOT rename `DiffLine`** — no real collision (admin vs challenge are different modules).
- `Theme` type actually imported by only 1 file (`ThemeToggle`); re-export from `ThemeContext.tsx` for zero blast radius.
- `locales` also used internally by `i18n.ts`; re-export from `i18n.ts`.
- `ScorePart` dedupe is SAFE (both definitions byte-identical); `CategoryOption` dedupe is VALID (2 genuine copies).
- Test files import moved symbols — must update: `ai-evaluator-answers.test.ts` (AIEvaluationResult), `AdminChallengeList.test.tsx` (AdminChallengeItem).
- Keep `Session`/`User` in `lib/auth/index.ts` (better-auth inference site); keep pgEnum arrays in schema files.
- Add `pnpm build` as a verification gate.

---

## Work Objectives

### Core Objective
Relocate a bounded set of shared/colocated constants and types out of logic files into dedicated `constants.ts`/`types.ts` files, with all importers updated and zero runtime-value changes.

### Concrete Deliverables
- `src/contexts/types.ts` (new) — `Theme`
- `src/i18n/constants.ts` (new) — `locales`
- `src/features/profile/types.ts` (exists) — add `UserProfileData`
- `src/features/challenge/constants.ts` (new) — `SEED_CATEGORIES`
- `src/features/challenge/types.ts` (exists) — add `AIEvaluationResult`, `HintItem`
- `src/features/admin/types.ts` (new) — `AdminChallengeItem`, `CategoryOption`
- `src/features/admin/constants.ts` (new) — `DIFFICULTY_VALUES`
- `src/lib/auth/types.ts` (new) — 3 Zod-inferred input types
- `grading.ts` updated to import `ScorePart` from `results/types.ts` (dedupe)
- Import updates across consumers (incl. 2 test files)

### Definition of Done
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm lint` (biome check src) exits 0
- [ ] `pnpm test` (vitest run) passes
- [ ] `pnpm build` exits 0
- [ ] Grep assertions (see tasks) confirm no stray definitions / no missing imports

### Must Have
- All 7 task extractions completed with importers updated
- `Theme` re-exported from `ThemeContext.tsx`; `locales` re-exported from `i18n.ts`
- `export type` used for every type re-export (isolatedModules)
- `ScorePart` defined exactly once (in `results/types.ts`)
- `CategoryOption` defined exactly once (in `admin/types.ts`)

### Must NOT Have (Guardrails)
- NO global `src/lib/constants` or `src/lib/types` directory
- NO renaming of any symbol (esp. `DiffLine`) — relocation only
- NO change to any constant/type value (4A)
- NO moving of `Session`/`User` from `lib/auth/index.ts`
- NO moving of pgEnum arrays in schema files
- NO extraction of the 36 component `Props` interfaces
- NO fixing of the 3 flagged mismatches (see Flagged Follow-ups)
- NO new tests required (behavior-preserving); NO new `any` (strict mode)

### Spec Framework Integration
- None detected (no OpenSpec/Spec Kit in repo).

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (Vitest).
- **Automated tests**: None added (pure relocation; existing suite is the regression net).
- **Framework**: Vitest (`pnpm test`).
- Behavior preservation is verified by the existing test suite + typecheck/lint/build.

### QA Policy
Every task includes agent-executed verification (grep assertions + repo-wide checks). Evidence is command output (exit codes, grep results).

- **Primary gate (run after all tasks)**: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- **Targeted checks per task**: grep confirming moved symbol no longer defined at old site (except intentional re-exports) and still resolvable at new site.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (ALL independent — run in parallel):
├── T1: contexts/types.ts — Theme
├── T2: i18n/constants.ts — locales
├── T3: profile/types.ts — UserProfileData
├── T4: challenge constants+types + ScorePart dedupe + test import
├── T5: admin/types.ts — AdminChallengeItem + CategoryOption
├── T6: admin/constants.ts — DIFFICULTY_VALUES dedupe
└── T7: lib/auth/types.ts — 3 Zod-inferred types

Wave FINAL (after all tasks — 4 parallel reviews, then user okay):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA / build+test run (unspecified-high)
└── F4: Scope fidelity check (deep)
```

### Dependency Matrix
- **T1**: none — none
- **T2**: none — none
- **T3**: none — none
- **T4**: none — none (internal: grading.ts + test import)
- **T5**: none — none
- **T6**: none — none
- **T7**: none — none
- **F1-F4**: depend on T1-T7 all complete

### Agent Dispatch Summary
- **Wave 1 (7 tasks)**: `quick` for T1,T2,T3,T5,T6; `unspecified-low` for T4 (dedupe + test import), T7 (z.infer import-type nuance).
- **Final (4)**: F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`.

---

## TODOs

- [x] 1. Extract `Theme` type → `src/contexts/types.ts`

  **What to do**:
  - Create `src/contexts/types.ts` containing the exact `Theme` union currently defined inline at `src/contexts/ThemeContext.tsx:11` (e.g. `export type Theme = "light" | "dark" | "system"` — copy the precise definition from the source).
  - In `ThemeContext.tsx`, remove the inline `export type Theme` declaration and add a re-export: `export type { Theme } from "./types";` (preserves the other 9 value/component importers).
  - Update `src/components/preferences/ThemeToggle.tsx` (the only file importing the `Theme` TYPE) to import `Theme` from `@/contexts/types` (or `./types`); keep `useTheme`/value imports from `ThemeContext` unchanged.

  **Must NOT do**:
  - Rename `Theme` or change its union values.
  - Remove or alter any other export of `ThemeContext.tsx` (ThemeProvider, useTheme, etc.).
  - Touch the 9 value/component importers — they keep working via the re-export.

  **Recommended Agent Profile**:
  - **Category**: `quick` — mechanical type relocation + single import update.
    - Reason: no logic change, deterministic edits, isolated to one file pair + one consumer.
  - **Skills**: none required.
  - **Skills Evaluated but Omitted**: `git-master` (no git operations needed in-task).

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2–T7)
  - **Blocks**: none
  - **Blocked By**: none

  **References**:
  - `src/contexts/ThemeContext.tsx:11` — current `Theme` union definition (copy exact form).
  - `src/components/preferences/ThemeToggle.tsx` — the sole `type Theme` importer (grep `import .*type Theme`).
  - Pattern: existing per-feature `types.ts` convention (e.g. `features/challenge/types.ts`).

  **Acceptance Criteria**:
  - [ ] `src/contexts/types.ts` exists with `export type Theme = ...` (exact copy of original).
  - [ ] `ThemeContext.tsx` re-exports `Theme` via `export type { Theme } from "./types";`.
  - [ ] `ThemeToggle.tsx` imports `Theme` from `@/contexts/types`.
  - [ ] `pnpm typecheck` exits 0.

  **QA Scenarios**:
  ```
  Scenario: Theme type resolves after extraction
    Tool: Bash (grep + pnpm typecheck)
    Preconditions: branch checked out, deps installed
    Steps:
      1. grep -rn "type Theme" src/contexts -> expect exactly 2 lines: ThemeToggle.tsx (import) and ThemeContext.tsx (re-export)
      2. pnpm typecheck -> exit code 0
    Expected Result: grep shows single definition in types.ts + re-export; typecheck clean.
    Failure Indicators: duplicate definition, or typecheck error referencing Theme.
    Evidence: .omo/evidence/task-1-theme-grep.txt, typecheck exit code.

  Scenario: Non-type importers of ThemeContext still compile (negative)
    Tool: Bash (pnpm typecheck)
    Preconditions: T1 applied
    Steps:
      1. pnpm typecheck -> must still be 0 (proves ThemeProvider/useTheme consumers unaffected)
    Expected Result: exit 0.
    Failure Indicators: any compile error in Sidebar/TopBar/layout files.
    Evidence: .omo/evidence/task-1-typecheck.txt
  ```

- [x] 2. Extract `locales` constant → `src/i18n/constants.ts`

  **What to do**:
  - Create `src/i18n/constants.ts` holding the exact `locales` const from `src/i18n/i18n.ts:6` (e.g. `export const locales = { en: ..., ar: ... } as const`).
  - In `i18n.ts`, import it: `import { locales } from "./constants";` and keep deriving `export type SupportedLocale = keyof typeof locales;`. Add a value re-export: `export { locales };` so existing importers keep working.
  - `src/components/preferences/LanguageSwitcher.tsx:11` imports `{ dynamicActivate, locales }` from `@/i18n/i18n` — this continues to work via the re-export (no change required, but verify).

  **Must NOT do**:
  - Change `locales` values or keys.
  - Rename `locales` or `SupportedLocale`.
  - Break `dynamicActivate` export from `i18n.ts`.

  **Recommended Agent Profile**:
  - **Category**: `quick` — value const relocation + re-export; one internal + one external consumer.
    - Reason: deterministic, no logic change.
  - **Skills**: none required.
  - **Skills Evaluated but Omitted**: `git-master`.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3–T7)
  - **Blocks**: none
  - **Blocked By**: none

  **References**:
  - `src/i18n/i18n.ts:6` — `locales` definition (copy exact form).
  - `src/i18n/i18n.ts` (internally derives `SupportedLocale = keyof typeof locales` — must import, not redefine).
  - `src/components/preferences/LanguageSwitcher.tsx:11` — external consumer (re-export preserves it).

  **Acceptance Criteria**:
  - [ ] `src/i18n/constants.ts` created with `export const locales = ...` (exact copy).
  - [ ] `i18n.ts` imports `locales` from `./constants` and re-exports it (`export { locales };`).
  - [ ] `SupportedLocale` still derived correctly in `i18n.ts`.
  - [ ] `pnpm typecheck` exits 0; `pnpm lint` exits 0.

  **QA Scenarios**:
  ```
  Scenario: locales resolves after extraction
    Tool: Bash (grep + typecheck/lint)
    Preconditions: T2 applied
    Steps:
      1. grep -rn "export const locales" src/i18n -> expect exactly 1 (constants.ts)
      2. grep -rn "locales" src/i18n/i18n.ts -> expect import + re-export + typeof usage
      3. pnpm typecheck && pnpm lint -> exit 0
    Expected Result: single definition; i18n.ts compiles; LanguageSwitcher unchanged resolves.
    Failure Indicators: "locales is not defined" or duplicate const.
    Evidence: .omo/evidence/task-2-locales-grep.txt

  Scenario: SupportedLocale type still valid (negative)
    Tool: Bash (pnpm typecheck)
    Preconditions: T2 applied
    Steps:
      1. pnpm typecheck -> 0; confirm no error referencing SupportedLocale
    Expected Result: exit 0.
    Failure Indicators: type error on keyof typeof locales in i18n.ts.
    Evidence: .omo/evidence/task-2-typecheck.txt
  ```

- [x] 3. Extract `UserProfileData` type → `features/profile/types.ts`

  **What to do**:
  - Move `export interface UserProfileData` (currently at `src/features/profile/queries.ts:16`) into the existing `src/features/profile/types.ts`.
  - In `queries.ts`, import it: `import type { UserProfileData } from "./types";` (or keep via relative).
  - Update the two external importers — `src/features/profile/components/ProfileScreen.tsx` and `src/features/profile/ProfilePage.tsx` — to import `UserProfileData` from `@/features/profile/types` instead of from `queries`.

  **Must NOT do**:
  - Change the `UserProfileData` interface shape or field names.
  - Move `UserSettingsData` (local-only, stays in `queries.ts`).

  **Recommended Agent Profile**:
  - **Category**: `quick` — type relocation + 3 import updates.
    - Reason: mechanical, deterministic, fully bounded.
  - **Skills**: none required.
  - **Skills Evaluated but Omitted**: `git-master`.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1,T2,T4–T7)
  - **Blocks**: none
  - **Blocked By**: none

  **References**:
  - `src/features/profile/queries.ts:16` — `UserProfileData` interface definition.
  - `src/features/profile/types.ts` — existing target file (follow its export style).
  - `src/features/profile/components/ProfileScreen.tsx`, `src/features/profile/ProfilePage.tsx` — importers (grep `UserProfileData`).

  **Acceptance Criteria**:
  - [ ] `UserProfileData` defined exactly once, in `features/profile/types.ts`.
  - [ ] `queries.ts`, `ProfileScreen.tsx`, `ProfilePage.tsx` import it from `./types` / `@/features/profile/types`.
  - [ ] `pnpm typecheck` exits 0.

  **QA Scenarios**:
  ```
  Scenario: UserProfileData resolves from types.ts
    Tool: Bash (grep + typecheck)
    Preconditions: T3 applied
    Steps:
      1. grep -rn "interface UserProfileData" src/features/profile -> expect exactly 1 (types.ts)
      2. grep -rn "UserProfileData" src/features/profile/queries.ts -> expect import only (no definition)
      3. pnpm typecheck -> exit 0
    Expected Result: single definition; importers compile.
    Failure Indicators: duplicate interface or unresolved import.
    Evidence: .omo/evidence/task-3-profile-grep.txt

  Scenario: Profile pages still typecheck (negative)
    Tool: Bash (pnpm typecheck)
    Preconditions: T3 applied
    Steps:
      1. pnpm typecheck -> 0
    Expected Result: exit 0; no error in profile feature.
    Failure Indicators: type error in ProfileScreen/ProfilePage.
    Evidence: .omo/evidence/task-3-typecheck.txt
  ```

- [x] 4. Challenge constants + types extraction + `ScorePart` dedupe + test import fix

  **What to do** (all within `features/challenge`):
  - **4a — constant**: Create `src/features/challenge/constants.ts`. Move `export const SEED_CATEGORIES = [...] as const` from `src/features/challenge/data/challenges.seed.ts:47` into it. Update `challenges.seed.ts` to import it; update `src/db/seed.ts` importer accordingly.
  - **4b — types**: In existing `src/features/challenge/types.ts`, add `AIEvaluationResult` (from `lib/ai-evaluator.ts:4`) and `HintItem` (from `components/HintsPanel.tsx:5`). Update `lib/ai-evaluator.ts` to import `AIEvaluationResult` (used by `grading.ts` and `ai-evaluator-answers.test.ts`); update `components/HintsPanel.tsx` to import `HintItem` (used by `ChallengeScreen`, `ChallengeTabs`).
  - **4c — test import**: `src/features/challenge/lib/ai-evaluator-answers.test.ts` imports `type AIEvaluationResult` from `./ai-evaluator` (wrapped import line) — repoint it to `@/features/challenge/types`.
  - **4d — ScorePart dedupe**: In `src/features/challenge/lib/grading.ts:19`, delete the locally-defined `export interface ScorePart` and add `import type { ScorePart } from "@/features/results/types";` (the identical definition already lives in `features/results/types.ts`). Verify all grading.ts usages still typecheck.

  **Must NOT do**:
  - Change any interface/const shape or value (4A).
  - Rename any symbol.
  - Move local-only challenge types (`Token`, `SandboxExecutionResult`, `GradingInput`, `GradingResult`, `TestResult`, `HiddenTestSpec`, `ChallengeWorkspace`, `SeedChallenge`) — they stay.
  - Modify `challenge/schema.ts` pgEnum arrays.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low` — multi-file move with a dedupe + a test-import repoint; needs care to keep grading.ts consistent.
    - Reason: highest-risk task in the plan (4 sub-edits, test file, cross-feature import to results).
  - **Skills**: none required.
  - **Skills Evaluated but Omitted**: `git-master`.

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T1–T3,T5–T7) — but all 4 sub-steps are in the same feature, do them in one agent pass to avoid split-brain edits.
  - **Parallel Group**: Wave 1
  - **Blocks**: none
  - **Blocked By**: none

  **References**:
  - `src/features/challenge/data/challenges.seed.ts:47` — `SEED_CATEGORIES`.
  - `src/db/seed.ts` — importer of `SEED_CATEGORIES`.
  - `src/features/challenge/lib/ai-evaluator.ts:4` — `AIEvaluationResult`.
  - `src/features/challenge/lib/grading.ts:1,19` — uses + defines `ScorePart`.
  - `src/features/challenge/components/HintsPanel.tsx:5` — `HintItem`.
  - `src/features/challenge/types.ts` — target types file.
  - `src/features/results/types.ts` — canonical `ScorePart` (byte-identical, validated by Metis).
  - `src/features/challenge/lib/ai-evaluator-answers.test.ts` — test import to repoint.

  **Acceptance Criteria**:
  - [ ] `SEED_CATEGORIES` defined once in `challenge/constants.ts`; `challenges.seed.ts` + `db/seed.ts` import it.
  - [ ] `AIEvaluationResult`, `HintItem` defined once in `challenge/types.ts`; their old sites now import.
  - [ ] `ScorePart` defined exactly once repo-wide (in `results/types.ts`); `grading.ts` imports it.
  - [ ] `ai-evaluator-answers.test.ts` imports `AIEvaluationResult` from `@/features/challenge/types`.
  - [ ] `pnpm typecheck` and `pnpm test` exit 0.

  **QA Scenarios**:
  ```
  Scenario: ScorePart defined exactly once
    Tool: Bash (grep)
    Preconditions: T4 applied
    Steps:
      1. grep -rn "interface ScorePart" src -> expect exactly 1 (features/results/types.ts)
      2. grep -rn "ScorePart" src/features/challenge/lib/grading.ts -> expect import only (no definition)
    Expected Result: single definition; grading compiles.
    Failure Indicators: 2 definitions, or grading type error.
    Evidence: .omo/evidence/task-4-scorepart-grep.txt

  Scenario: challenge test suite still passes (negative/integration)
    Tool: Bash (pnpm test)
    Preconditions: T4 applied
    Steps:
      1. pnpm test src/features/challenge -> all pass (incl. ai-evaluator-answers.test.ts)
    Expected Result: pass.
    Failure Indicators: AIEvaluationResult import error in test.
    Evidence: .omo/evidence/task-4-test.txt
  ```

- [x] 5. Extract `AdminChallengeItem` + dedupe `CategoryOption` → `features/admin/types.ts`

  **What to do**:
  - Create `src/features/admin/types.ts`.
  - Move `export interface AdminChallengeItem` from `src/features/admin/components/AdminChallengeList.tsx:36` into it. Update importers: `AdminChallengeList.tsx` (definition site), `src/features/admin/components/AdminQuestionsPage.tsx`, and `src/features/admin/components/AdminChallengeList.test.tsx`.
  - Dedupe `CategoryOption`: the two identical `interface CategoryOption` copies at `src/features/admin/components/QuestionGeneratorStudio.tsx:32` and `src/features/admin/components/ManualChallengeCreator.tsx:31` are replaced by a single `export interface CategoryOption` in `admin/types.ts`; both components import it.

  **Must NOT do**:
  - Change the shape of `AdminChallengeItem` or `CategoryOption`.
  - Rename either symbol.
  - Move admin `DiffLine`, `ChallengeFile`, `ChallengeHiddenTest`, `ChallengeHint`, `GeneratedChallengeDraft` (single-file/local — out of scope per Metis).
  - Touch `RawParsedChallenge` (dropped per 1A).

  **Recommended Agent Profile**:
  - **Category**: `quick` — type relocation + dedupe + 4 import updates.
    - Reason: deterministic; the two `CategoryOption` copies are confirmed identical by Metis.
  - **Skills**: none required.
  - **Skills Evaluated but Omitted**: `git-master`.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1–T4,T6,T7)
  - **Blocks**: none
  - **Blocked By**: none

  **References**:
  - `src/features/admin/components/AdminChallengeList.tsx:36` — `AdminChallengeItem`.
  - `src/features/admin/components/AdminChallengeList.test.tsx` — test importer of `AdminChallengeItem`.
  - `src/features/admin/components/AdminQuestionsPage.tsx` — importer of `AdminChallengeItem`.
  - `src/features/admin/components/QuestionGeneratorStudio.tsx:32` & `ManualChallengeCreator.tsx:31` — the two `CategoryOption` copies.

  **Acceptance Criteria**:
  - [ ] `AdminChallengeItem` defined once in `admin/types.ts`; 3 importers updated.
  - [ ] `CategoryOption` defined once in `admin/types.ts`; both components import it (no local copies remain).
  - [ ] `pnpm typecheck` exits 0; `pnpm test` (admin test) passes.

  **QA Scenarios**:
  ```
  Scenario: AdminChallengeItem + CategoryOption each defined once
    Tool: Bash (grep + typecheck/test)
    Preconditions: T5 applied
    Steps:
      1. grep -rn "interface AdminChallengeItem" src -> exactly 1 (admin/types.ts)
      2. grep -rn "interface CategoryOption" src -> exactly 1 (admin/types.ts)
      3. pnpm typecheck -> 0; pnpm test src/features/admin -> pass
    Expected Result: single definitions; admin compiles + tests pass.
    Failure Indicators: duplicate interface or test import error.
    Evidence: .omo/evidence/task-5-admin-grep.txt

  Scenario: No stray CategoryOption copies remain (negative)
    Tool: Bash (grep)
    Preconditions: T5 applied
    Steps:
      1. grep -rn "interface CategoryOption" src/features/admin/components -> expect 0 matches
    Expected Result: 0 (both components now import).
    Failure Indicators: any remaining local definition.
    Evidence: .omo/evidence/task-5-categoryoption-grep.txt
  ```

- [x] 6. Dedupe difficulty literal → `features/admin/constants.ts` (`DIFFICULTY_VALUES`)

  **What to do**:
  - Create `src/features/admin/constants.ts`.
  - Add `export const DIFFICULTY_VALUES = ["easy", "medium", "hard"] as const;` — exact values copied from the duplicated inline literals.
  - Update `src/features/admin/components/QuestionGeneratorStudio.tsx:310` and `src/features/admin/components/ManualChallengeCreator.tsx:379` to import `DIFFICULTY_VALUES` from `@/features/admin/constants` instead of their inline `as const` literals.

  **Must NOT do**:
  - Change the values (`"easy"|"medium"|"hard"`) — preserve exactly (4A).
  - Touch `src/features/challenge/schema.ts:38` `difficultyEnum` (pgEnum array; schema scope, out of scope).
  - Rename `DIFFICULTY_VALUES` or move it to a global `src/lib/constants`.

  **Recommended Agent Profile**:
  - **Category**: `quick` — constant dedupe + 2 import updates (the core "hotspot" extraction).
    - Reason: mechanical; this is the highest-value duplication fix from exploration.
  - **Skills**: none required.
  - **Skills Evaluated but Omitted**: `git-master`.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1–T5,T7)
  - **Blocks**: none
  - **Blocked By**: none

  **References**:
  - `src/features/admin/components/QuestionGeneratorStudio.tsx:310` — inline difficulty literal.
  - `src/features/admin/components/ManualChallengeCreator.tsx:379` — inline difficulty literal.
  - `src/features/challenge/schema.ts:38` — `difficultyEnum` (context only; NOT modified — flagged follow-up).
  - Pattern: `features/profile/constants.ts` as the existing per-feature constants convention.

  **Acceptance Criteria**:
  - [ ] `DIFFICULTY_VALUES` defined once in `admin/constants.ts`.
  - [ ] Both admin components import it; no inline `["easy","medium","hard"] as const` remains.
  - [ ] `pnpm typecheck` exits 0.
  - [ ] `challenge/schema.ts` `difficultyEnum` is unmodified (git diff shows no change there).

  **QA Scenarios**:
  ```
  Scenario: difficulty literal deduplicated
    Tool: Bash (grep + git diff)
    Preconditions: T6 applied
    Steps:
      1. grep -rn "DIFFICULTY_VALUES" src/features/admin -> expect definition in constants.ts + 2 imports
      2. grep -rn 'as const\]$' src/features/admin/components/QuestionGeneratorStudio.tsx src/features/admin/components/ManualChallengeCreator.tsx -> expect no difficulty literal line
      3. git diff --stat src/features/challenge/schema.ts -> expect no change
    Expected Result: single source; schema untouched.
    Failure Indicators: duplicate literal remains, or difficultyEnum changed.
    Evidence: .omo/evidence/task-6-difficulty-grep.txt

  Scenario: admin components still typecheck (negative)
    Tool: Bash (pnpm typecheck)
    Preconditions: T6 applied
    Steps:
      1. pnpm typecheck -> 0
    Expected Result: exit 0.
    Failure Indicators: type error in the two admin components.
    Evidence: .omo/evidence/task-6-typecheck.txt
  ```

- [x] 7. Extract Zod-inferred auth input types → `src/lib/auth/types.ts`

  **What to do**:
  - Create `src/lib/auth/types.ts`.
  - Move the three `export type X = z.infer<typeof XSchema>` lines from `src/lib/auth/validation.ts:24-26` (`SignUpEmailInput`, `SignInEmailInput`, `ForgetPasswordInput`) into it.
  - In `types.ts`, import the schemas with `import type`: `import type { signUpEmailSchema, signInEmailSchema, forgetPasswordSchema } from "./validation";` then `export type SignUpEmailInput = z.infer<typeof signUpEmailSchema>;` etc. (use the exact schema names present in `validation.ts`).
  - In `validation.ts`, add a re-export: `export type { SignUpEmailInput, SignInEmailInput, ForgetPasswordInput } from "./types";` so existing importers keep resolving. Grep for importers and update them to `@/lib/auth/types` if cleaner.

  **Must NOT do**:
  - Move the Zod schemas themselves out of `validation.ts` (they stay; only the inferred types move).
  - Change any type. Do NOT touch `Session`/`User` in `lib/auth/index.ts` (better-auth inference site).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low` — type-only extraction requiring `import type` discipline (isolatedModules) and a re-export decision.
    - Reason: subtle import-type requirement; must not drag runtime schema deps into a `.ts` types file incorrectly.
  - **Skills**: none required.
  - **Skills Evaluated but Omitted**: `git-master`.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1–T6)
  - **Blocks**: none
  - **Blocked By**: none

  **References**:
  - `src/lib/auth/validation.ts:24-26` — the three `z.infer` types + their schemas (read exact schema identifiers).
  - `src/lib/auth/index.ts` — pattern reference for how auth types are exported (do NOT modify).
  - `tsconfig.json` `isolatedModules: true` — mandates `export type` for type re-exports and `import type` for type-only imports.

  **Acceptance Criteria**:
  - [ ] `src/lib/auth/types.ts` defines the 3 types via `import type` of schemas.
  - [ ] `validation.ts` re-exports them (or importers updated) — no broken import.
  - [ ] `pnpm typecheck` exits 0; no `any` introduced.
  - [ ] `Session`/`User` in `lib/auth/index.ts` unchanged (git diff clean there).

  **QA Scenarios**:
  ```
  Scenario: auth z.infer types resolve from types.ts
    Tool: Bash (grep + typecheck)
    Preconditions: T7 applied
    Steps:
      1. grep -rn "z.infer" src/lib/auth/validation.ts -> expect 0 (moved out)
      2. grep -rn "SignUpEmailInput" src/lib/auth/types.ts -> expect definition
      3. pnpm typecheck -> exit 0
    Expected Result: types defined once in types.ts; consumers compile.
    Failure Indicators: "cannot find name SignUpEmailInput" or typecheck error.
    Evidence: .omo/evidence/task-7-auth-grep.txt

  Scenario: no runtime import leaked into types file (negative)
    Tool: Bash (grep)
    Preconditions: T7 applied
    Steps:
      1. grep -n "import" src/lib/auth/types.ts -> expect only `import type ... from "./validation"`
    Expected Result: only type-only import present (no value import of schemas).
    Failure Indicators: a non-`type` import of the schema module.
    Evidence: .omo/evidence/task-7-import-type.txt
  ```

---

> **Note on Flagged Follow-ups**: The 3 mismatches in the final section are intentionally OUT of scope (decision 4A). Do not fix them in this plan.

---

## Final Verification Wave (MANDATORY)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> Do NOT auto-proceed after verification. Wait for user's explicit approval.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, grep). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found (e.g. global `src/lib/constants`, renamed `DiffLine`, changed values). Check evidence (command outputs) exist.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `pnpm typecheck` + `pnpm lint` (biome check src) + `pnpm test`. Review changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Execute the existing relevant test suites (auth validation, challenge grading, admin challenge list). Save outputs to `.omo/evidence/final-qa/`.
  Output: `Typecheck [0] | Lint [0] | Tests [pass] | Build [0] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git diff). Verify 1:1 — everything in scope built (no missing), nothing beyond scope built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy
- Group by task file where natural; each commit message follows `type(scope): desc`.
- Pre-commit: `pnpm typecheck && pnpm lint` for affected files.
- Example: `refactor(contexts): extract Theme type to contexts/types.ts`

---

## Success Criteria

### Verification Commands
```bash
pnpm typecheck   # Expected: exit 0
pnpm lint        # Expected: exit 0 (biome check src)
pnpm test        # Expected: vitest run — all pass
pnpm build       # Expected: exit 0
```

### Grep Assertions (run after all tasks)
```bash
grep -rn "interface ScorePart" src                  # -> exactly 1 (features/results/types.ts)
grep -rn "interface CategoryOption" src             # -> exactly 1 (features/admin/types.ts)
grep -rn "type Theme" src/contexts                  # -> ThemeToggle.tsx (updated) + ThemeContext.tsx re-export
grep -rn "from \"./ai-evaluator\"" src/features/challenge/lib/ai-evaluator-answers.test.ts  # -> no AIEvaluationResult import
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] `pnpm build` succeeds

---

## Flagged Follow-ups (NOT in scope — 4A, do NOT fix)
1. **Difficulty casing mismatch**: `src/lib/domain/types.ts` defines `Difficulty = "Easy"|"Medium"|"Hard"|"Expert"` (capitalized, +Expert) but schema/UI use lowercase `"easy"|"medium"|"hard"`.
2. **Category slug vs label**: `lib/domain/categories.ts` keys by display label while `SEED_CATEGORIES`/`PROMPT_PRESETS` use slugs.
3. **`profileLinkPlatformEnum` vs `supportedProviders`** diverge (google/discord vs twitter/linkedin/website/stackoverflow) — possible real bug.
