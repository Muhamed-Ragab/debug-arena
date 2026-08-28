# Browser Feature

## Overview
Client challenge browser: filter by category/difficulty/search, pagination (6 per page), card grid.

## How it works
`challenges/page.tsx` (server) fetches `getPublishedChallenges` (via challenge/queries facade → service → repository) → passes `initialChallenges` as prop to `ChallengeBrowser` (`"use client"`). `ChallengeBrowser` holds only `page` `useState` + pagination slice and **delegates all filtering to `useChallengeFilters`** (canonical hook, `null` sentinels, `toggle*`). Resolved: the inline `challenges.filter(...)` duplicate was removed — `ChallengeBrowser` now calls `useChallengeFilters(initialChallenges)` and renders `filtered`. `ChallengeFilters` UI + `ChallengeCard` are pure.

## File map
| File | Role |
|------|------|
| `components/ChallengeBrowser.tsx` | `"use client"`, delegates filtering to `useChallengeFilters`; holds only `page` state + pagination |
| `hooks/useChallengeFilters.ts` | Reusable hook, `null` sentinels, `toggleCategory`/`toggleDifficulty`, no pagination |
| `components/ChallengeFilters.tsx` | `"use client"` filter UI |
| `components/ChallengeCard.tsx` | Pure card |
| `components/ChallengeBrowser.test.tsx` | Test |

## Data flow
```
challenges/page.tsx (server) → getPublishedChallenges (service → repository → db) → ChallengeBrowser (client) receives initialChallenges → useState filters → useMemo filtered → pagination → ChallengeCard grid
```

## SOLID notes
- **Pure Components**: `ChallengeCard` pure, `ChallengeBrowser` now delegates filter state to `useChallengeFilters` (keeps only `page` state).
- **Duplicate**: Resolved — `ChallengeBrowser` now delegates to `useChallengeFilters` (single filter implementation, `null` sentinels).
- **No service/repository**: Browser is page/component-only, uses challenge service.

## How to run/test
`pnpm test src/features/browser/components/ChallengeBrowser.test.tsx` — render with 3 challenges, filter by category, assert pagination.

## Conventions
- No `repository.ts`/`service.ts` (uses challenge), flat `hooks/` for client logic.
