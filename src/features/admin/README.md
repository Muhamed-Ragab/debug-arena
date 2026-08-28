# Admin Feature

## Overview
Admin challenge studio: AI generation (`generateQuestionDraft`/`refineQuestionDraft` via Groq), manual creation, save with deterministic embedding, status toggle, cascade delete.

## How it works
`admin/questions/page.tsx` → `service.ts` (`saveChallenge` 6-step: resolve category → embedding → insert/update challenges → delete/insert hints → upsertEmbedding, `toggleStatus`, `deleteChallengeCascade`, `generateQuestionDraft`, `refineQuestionDraft`) → `repository.ts` (`findCategories`, `findChallenges`, `findChallengeById`, `insertChallenge`, `updateChallenge`, `deleteHintsByChallengeId`, `insertHints`, `upsertEmbedding`, `deleteChallengeCascade`) → `db` (`challenges`, `hints`, `challengeEmbeddings`, `submissions`). Components `AdminQuestionsPage`, `AdminChallengeList` (calls toggle/delete), `ManualChallengeCreator` (calls save), `QuestionGeneratorStudio` (calls generate/refine/save) are `"use client"`.

## File map
| File | Role |
|------|------|
| `repository.ts` | Raw `db.query`/`insert`/`update`/`delete`, manual cascade order hints→embeddings→submissions→challenges |
| `service.ts` | Orchestration, `generateDeterministicEmbedding` (pure), `revalidatePath` handling |
| `constants.ts` | `DIFFICULTY_VALUES` |
| `types.ts` | `AdminChallengeItem`, `GeneratedChallengeDraft`, `SaveChallengeInput` |
| `validation.ts` | `rawLlmChallengeSchema` |
| `lib/question-generator-agent.ts` | AI strategies + pure `computeUnifiedDiff`/`detectBuggyLines` |
| `components/*` | Client wrappers, all data via `actions.ts` facade |
| `queries.ts`/`actions.ts` | Facades → service/repository |

## Data flow
```
QuestionGeneratorStudio → generateQuestionAction → service.generateQuestionDraft → Groq → draft → refine → saveChallengeAction → service.saveChallenge → repository (resolve category, embedding, upsert) → revalidate /challenges + /admin/questions
AdminChallengeList → toggleChallengeStatusAction → service.toggleStatus → repository.updateChallenge
→ deleteAdminChallengeAction → service.deleteChallengeCascade → repository.deleteChallengeCascade (4 deletes)
```

## SOLID notes
- **SRP**: repository only DB, service only orchestration + embedding, lib only AI.
- **DIP**: service injects `adminRepository` via param.
- **Pure**: `embedding.ts` deterministic, `diff` helpers pure.
- **Transaction**: save/delete should wrap in `db.transaction` via repository (not yet, noted).

## How to run/test
`pnpm test src/features/admin/service.test.ts` — mock repo, assert `saveChallenge` calls `insertChallenge` + `insertHints` + `upsertEmbedding` in order, `deleteChallengeCascade` order.

## Conventions
- Flat files, `server-only` in repo, no `repositories/` folder.
