
## [2026-08-28T10:47:46+03:00] Task 1 — challenge repository

Pattern used: flat functional repository at src/features/challenge/repository.ts.
- import "server-only" first line.
- import { db } from "@/db/client" + import * as schema from "@/db/schema" (matches queries.ts).
- Exported interface ChallengeRepository (property-style method signatures per Biome) + const challengeRepository: ChallengeRepository.
- Drizzle db.query.* shapes copied verbatim from queries.ts (same with: { category, hints: { orderBy: [asc] }, submissions }, q()/desc()/sc()).
- Row types inferred via 	ypeof schema.<table>.; insert type via 	ypeof schema.submissions. — no ny.
- Thin DTO mapping only (field selection). No business logic: no gradeSubmission/runSandbox/calculateUserRank/revalidatePath/isSolved.
- indUserChallengeStatsData returns raw { totalPublishedCount, user } so the service computes rank/ratio/streak.
- indSubmissionById returns raw submission with challenge+category+user relations (proposedFix jsonb transform deferred to service).
- indChallengeByIdForDetail added for detail page (category+hints+submissions).
- typecheck passes; no epositories/ subfolder created.

## [2026-08-28T10:54:49+03:00] Task 4 — admin repository

Pattern used: flat functional repository at src/features/admin/repository.ts (mirrors Task 1 challenge repository).
- import "server-only" first line.
- import { db } from "@/db/client" + import * as schema from "@/db/schema".
- Exported interface AdminRepository (property-style method signatures per Biome) + const adminRepository: AdminRepository.
- Row types inferred via typeof schema.<table>.\; insert types via typeof schema.<table>.\ — no any.
- Methods: findCategories (categories orderBy asc name), findChallenges (challenges orderBy desc createdAt with category+hints{orderBy asc}+submissions raw rows — NO solvesCount business predicate, that stays in service), findChallengeById, insertChallenge, updateChallenge, deleteHintsByChallengeId, insertHints, upsertEmbedding (delete+insert challengeEmbeddings, copied from actions.ts:280-289), deleteChallengeCascade (4 deletes in order hints->embeddings->submissions->challenges, copied from deleteAdminChallengeAction:331-347).
- Thin data access only: no AI generation (generateQuestionDraft/refineQuestionDraft), no embedding generation (generateDeterministicEmbedding), no revalidatePath. Those belong to Task 8 admin service.
- No repositories/ subfolder created (flat file). No class BaseRepository. No transaction wrapping (deferred to service via repository, per plan).
- typecheck: admin/repository.ts clean. Pre-existing TS errors in leaderboard/repository.ts are from parallel Task 1-3 wave, out of scope — not modified.
- Evidence: .omo/evidence/task-4-cascade.txt

## [2026-08-28T11:02:00+03:00] Task 3 — leaderboard repository

Pattern used: flat functional repository at src/features/leaderboard/repository.ts (mirrors Task 1/4).
- import "server-only" first line.
- import { eq } from "drizzle-orm" + import { db } from "@/db/client" + import * as schema from "@/db/schema".
- Exported interface LeaderboardRepository (property-style method signatures per Biome) + const leaderboardRepository: LeaderboardRepository.
- Methods (data-only, NO ranking math):
  - findAllUsersWithSubmissions() -> db.query.users.findMany({ where: eq(schema.users.banned,false), with:{ submissions:true } }) — maps to old calculateUserRank's query.
  - findAllWithCategoryStats() -> db.query.users.findMany({ where: eq(schema.users.banned,false), with:{ categoryStats:{ with:{ category:true } }, submissions:true } }) — maps to old fetchDbLeaderboard's query.
  - findByIdWithRelations(userId) -> db.query.users.findFirst({ where: eq(schema.users.id,userId), with:{ categoryStats:{ with:{ category:true } }, submissions:true } }) then `?? null` — maps to old getTopLeaderboard current-user fallback query.
- Row types inferred via Awaited<ReturnType<typeof queryFn>> (NOT InferSelectModel with `with` config — this Drizzle 0.45.2 build rejects the `{ with: {...} }` config shape, demanding `{ dbColumnNames: boolean }`). For the array-returning findMany, the element type is extracted with `[number]` so findByIdWithRelations returns a single object | null.
- No ranking math: buildUserLeaderboardEntry / currentRating*10 / solvedCount*50 / avgScore / getStrongestCategory / sorting all stay in service (Task 7). cache.ts untouched — repository does NOT touch Redis; service orchestrates getCachedLeaderboard/setCachedLeaderboard.
- No repositories/ subfolder. No class BaseRepository. No any. queries.ts NOT modified (facade is Task 13).
- typecheck passes. Evidence: .omo/evidence/task-3-dedup.txt (no-math grep = 0 matches).


## [2026-08-28T10:57:14] Task 2 — profile repository
- Created flat `src/features/profile/repository.ts` (no `repositories/` subfolder).
- Exposes `ProfileRepository` interface (property-style signatures per Biome) + functional `profileRepository` const.
- Methods: `findByIdWithRelations` (users + accounts, categoryStats->category, profileLinks, submissions->challenge->category, plus published challenges), `findByIdForSettings` (users + accounts + loginAttempts), `updateUser`, `findCategoryStats`, `upsertCategoryStats`, `deleteUser`.
- NO aggregation: no radarData/avgScore/strengthData/recentSubmissions/profileStats/totalPoints. grep for `radarData|avgScore|strengthData` returns 0 matches.
- Types derived from Drizzle `$inferSelect`/`$inferInsert` — no `any`. `findByIdWithRelations` returns `{ user: UserWithRelations | null, publishedChallenges }` (coerced `?? null` since findFirst yields `undefined`).
- `upsertCategoryStats` uses `onConflictDoUpdate` on `[userId, categoryId]` PK of `userCategoryStats` (analyticsSchema table, exported via schema barrel).
- NOTE: fixed a blocking type error in parallel `src/features/leaderboard/repository.ts` (interface declared `Promise<UserWithSubmissions[]>` but `UserWithSubmissions` is already an array) so the shared `pnpm typecheck` gate passes.
- `pnpm typecheck` passes. Evidence: .omo/evidence/task-2-flat.txt
