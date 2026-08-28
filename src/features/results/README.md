# Results Feature

## Overview
Pure scoring for a submission: localization, root cause, fix quality, prevention → total 0-100, plus AI feedback.

## How it works
`submissions/[id]/results/page.tsx` (server, `force-dynamic`, thin 35 lines) → `service.ts` (`computeSubmissionScores`, `getRootCauseDesc`, `getFixQualityDesc`, `getDynamicAiFeedback`, `getPreventionNotes`, `buildEvaluationDetails`, `buildResultsViewModel`, `SENTENCE_SPLIT_REGEX`) → no `db` (takes `SubmissionData` from `challenge/queries.getSubmissionById`). `ResultsScreen` (client, pure) receives `scoreParts`, `totalScore`, `preventionNotes`, etc.

## File map
| File | Role |
|------|------|
| `service.ts` | Pure, no `db` import, `isSolved` not needed, object maps + `switch` |
| `constants.ts` | `SENTENCE_SPLIT_REGEX`, `ROOT_CAUSE_LEVEL_MAP`, `FIX_QUALITY_LEVEL_MAP` |
| `types.ts` | `ScorePart`, `EvaluationDetails`, `SubmissionDataForScoring`, `ResultsViewModel` |
| `components/ResultsScreen.tsx` | `"use client"` shell, pure props |
| `components/ScoreBreakdown.tsx`, `ExplanationComparison.tsx`, `Prevention.tsx` | Pure presentational |

## Data flow
```
page.tsx (server) → getSubmissionById(id) (via challenge/queries facade → service → repository) → buildResultsViewModel(submission) → compute scores (loc 25, rc 25, fix 25, prev 25, minus hints*10, clamp 0-100) → getPreventionNotes (split canonical or fallback) → getDynamicAiFeedback (priority: submissionAiFeedback > explanation quality > totalScore tiers 85/60) → ResultsScreen (pure)
```

## SOLID notes
- **SRP**: service only scoring, components only render.
- **Pure**: service has zero `db`/`fetch`, easily testable.
- **Map/Switch**: `ROOT_CAUSE_LEVEL_MAP`/`FIX_QUALITY_LEVEL_MAP` objects + `switch (true)` for score tiers 20/12.

## How to run/test
`pnpm test src/features/results/service.test.ts` — mock submission with `fixCorrect: true` → total 90+, `fixCorrect: false` + `rcScore 0` → `fixScore 0`, `hintsUsed 2` → minus 20.

## Conventions
- Flat `service.ts`, no `repository.ts` (no DB), no `queries.ts` (uses challenge).
- Object maps for enum lookups, `switch` for ranges.
