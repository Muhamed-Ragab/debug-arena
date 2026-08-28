# Leaderboard Feature

## Overview
Global ranking by `currentRating*10 + solved*50`, with strongest category and cache (Redis 24h).

## How it works
`leaderboard/page.tsx` (server, `force-dynamic`) → `service.ts` (`getTopLeaderboard`, `calculateUserRank`, `buildUserLeaderboardEntry`, `isSolved`, `calcPoints`, `getStrongestCategory`) → `repository.ts` (`findAllUsersWithSubmissions`, `findAllWithCategoryStats`, `findByIdWithRelations`) → `db` (`users` with `submissions`, `categoryStats`). Cache via `cache.ts` (`getCachedLeaderboard`/`setCachedLeaderboard`). Client `LeaderboardScreen` filters by category, `LeaderboardTable` paginates.

## File map
| File | Role |
|------|------|
| `repository.ts` | 3 `db.query.users` calls, no math |
| `service.ts` | Scoring: `isSolved` (`fixCorrect || totalScore>=60`), `calcPoints`, `buildUserLeaderboardEntry`, ranking + cache orchestration |
| `constants.ts` | `SCORE_WEIGHT_RATING=10`, `SCORE_WEIGHT_SOLVED=50` |
| `types.ts` | `LeaderboardEntry`, `LeaderboardTab` |
| `cache.ts` | Redis 24h, `getLeaderboardCacheKey`, `invalidateLeaderboardCache` (kept as-is) |
| `hooks/useLeaderboard.ts` | Tab state |
| `components/LeaderboardScreen.tsx` | `useMemo` filter, pure |
| `queries.ts` | Facade → service |
| `types.ts` | Entry shape |

## Data flow
```
page.tsx → service.getTopLeaderboard({ currentUserId, period }) → cache.get → if miss: repository.findAllWithCategoryStats → build entries → cache.set → map isUser flag → append current user if missing via repository.findByIdWithRelations + calculateUserRank → LeaderboardPage (client) → LeaderboardScreen → TopThree + Table
```

## SOLID notes
- **DIP**: service injects repository param.
- **Pure Components**: `LeaderboardTopThree`, `LeaderboardTable` (pagination via `useState` page only UI) receive `initialEntries` prop.
- **Map/Switch**: `getStrongestCategory` uses sort, but `CATEGORY` map drives display; `switch` for period branches if added.

## How to run/test
`pnpm test src/features/leaderboard/service.test.ts` — mock repo, assert `isSolved` 1 def, `buildUserLeaderboardEntry` score = rating*10 + solved*50, `calculateUserRank` sorts correctly.

## Conventions
- Flat `repository.ts`/`service.ts`, `server-only` in repo.
- No `repositories/` folder, no `any`, `cache.ts` untouched.
