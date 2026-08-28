# Notepad: separate-constants-types

## LEARNINGS (conventions from plan + codebase)
- Project separation convention: src/lib/domain/{categories,types,index}.ts (shared), per-feature types.ts (profile/results/leaderboard/challenge), only features/profile/constants.ts exists as constants file.
- Naming: types.ts / constants.ts (no dot suffix); named exports only; @/ alias for cross-module; relative ./ intra-feature; index.ts barrels where present.
- tsconfig.json has isolatedModules: true -> ALL type re-exports MUST use export type; type-only imports MUST use import type.
- Verification order: pnpm lint -> pnpm format:check -> pnpm typecheck -> pnpm test -> pnpm build.
- Biome is the linter/formatter (biome check src). Vitest for tests (pnpm test). Strict mode: NEVER use any.

## DECISIONS (from interview + Metis)
- Scope (1A): extract ONLY shared (used in 2+ files) constants/types, duplication hotspots, colocated Zod-inferred types. Local-only inline items stay.
- Location (2A): extend src/lib/domain + per-feature constants.ts/types.ts. NO global src/lib/constants.
- Props (3A): keep 36 local component Props interfaces inline.
- Inconsistencies (4A): relocate only; do NOT change values. Flag mismatches as follow-ups.
- Do NOT rename DiffLine. Theme re-exported from ThemeContext.tsx; locales re-exported from i18n.ts.
- ScorePart dedupe SAFE (byte-identical); CategoryOption dedupe VALID (2 genuine copies).
- Keep Session/User in lib/auth/index.ts; keep pgEnum arrays in schema files.
- Test files import moved symbols must update: ai-evaluator-answers.test.ts (AIEvaluationResult), AdminChallengeList.test.tsx (AdminChallengeItem).

## FLAGGED FOLLOW-UPS (OUT OF SCOPE - do NOT fix)
1. Difficulty casing mismatch. 2. Category slug vs label. 3. profileLinkPlatformEnum vs supportedProviders diverge.

## ISSUES / GOTCHAS
- Plan line numbers may be stale - ALWAYS grep for actual current symbol location before editing.
- When moving a type that other files import, either re-export from old site OR update all importers.
