# Profile Feature

## Overview
User profile and settings: stats aggregation, radar/strength charts, recent submissions, and account management (edit profile, linked accounts, sessions).

## How it works
`profile/page.tsx` → `service.ts` (`getUserProfileData`, `getUserSettingsData`, `isSolved`, `calcPoints`, `buildRadarData`, `buildCategoryStats`, `buildStrengthData`) → `repository.ts` (`findByIdWithRelations`, `findByIdForSettings`, `updateUser`, `findCategoryStats`, `upsertCategoryStats`, `deleteUser`) → `db` (`users`, `userCategoryStats`, `profileLinks`, `submissions`). Client `ProfileScreen` (pure) ← no heavy hook (form state in `EditProfileForm`).

## File map
| File | Role |
|------|------|
| `repository.ts` | Raw `db.query.users.findFirst` + `challenges.findMany`, no aggregation |
| `service.ts` | Aggregation: `solvedChallengeIds` via `isSolved`, `totalPoints`, `radarData`, `categoryStats`, `strengthData`, `recentSubmissions` |
| `constants.ts` | `AVATAR_PRESETS`, `DEFAULT_CATEGORIES` |
| `types.ts` | `RadarPoint`, `StrengthPoint`, `RecentSubmission`, `CategoryStat`, `ProfileStat`, `UserProfileData`, `UserSettingsData`, `AvatarPreset` |
| `components/ProfileScreen.tsx` | Near-pure, props-only render |
| `queries.ts` / `actions.ts` | Facades → service/repository |
| `utils/` | `calcPoints`, `isSolved` helpers re-exported if needed |

## Data flow
```
page.tsx → service.getUserProfileData(userId, repo) → repository.findByIdWithRelations → db
service: filter submissions via isSolved, compute totalPoints = currentRating*10 + solved*50, build radar/category/strength, call leaderboard/service.calculateUserRank
→ ProfileScreen (pure) renders ProfileStats, CategoryStrengthChart, RecentSubmissions
```

## SOLID notes
- **SRP**: repository only DB reads/writes, service only aggregation.
- **DIP**: service injects `profileRepository` via param.
- **Pure Components**: `ProfileScreen` has zero `useState`, child charts are pure.
- **Map/Switch**: `DEFAULT_CATEGORIES` map drives radar/category loops; `switch` for `handleDisplay` branches.

## How to run/test
`pnpm test src/features/profile/service.test.ts` — mock repo with 2 submissions (one solved via `fixCorrect`, one not), assert `radarData` 4 entries, `totalPoints` = rating*10 + solved*50, `isSolved` 1 def.

## Conventions
- Flat `repository.ts`/`service.ts`, `server-only` in repo.
- Helpers deduped: `isSolved`/`calcPoints` 1 def each.
- See `docs/architecture.md`.
