# Browser Feature

## Overview
Client challenge browser: filter by category/difficulty/search, pagination (6 per page), card grid.

## How it works
`challenges/page.tsx` (server) fetches `getPublishedChallenges` (via challenge/queries facade → service → repository) → passes `initialChallenges` as prop to `ChallengeBrowser` (`"use client"`). `ChallengeBrowser` holds `search`, `category`, `difficulty`, `page` `useState` (4) + `useMemo` filtered + pagination slice. `useChallengeFilters` hook (separate, `null` sentinels, `toggle*`) exists but **not used by `ChallengeBrowser`** — duplicate, tech debt to consolidate. `ChallengeFilters` UI + `ChallengeCard` are pure.

## File map
| File | Role |
|------|------|
| `components/ChallengeBrowser.tsx` | `"use client"`, inline `useState` + `useMemo` (business-ish filter) → should move to hook |
| `hooks/useChallengeFilters.ts` | Reusable hook, `null` sentinels, `toggleCategory`/`toggleDifficulty`, no pagination |
| `components/ChallengeFilters.tsx` | `"use client"` filter UI |
| `components/ChallengeCard.tsx` | Pure card |
| `components/ChallengeBrowser.test.tsx` | Test |

## Data flow
```
challenges/page.tsx (server) → getPublishedChallenges (service → repository → db) → ChallengeBrowser (client) receives initialChallenges → useState filters → useMemo filtered → pagination → ChallengeCard grid
```

## SOLID notes
- **Pure Components**: `ChallengeCard` pure, `ChallengeBrowser` should be pure but currently holds filter state — extract to `useChallengeBrowser` hook.
- **Duplicate**: Two filter implementations (inline `all` sentinels vs hook `null` sentinels) — consolidate on hook.
- **No service/repository**: Browser is page/component-only, uses challenge service.

## How to run/test
`pnpm test src/features/browser/components/ChallengeBrowser.test.tsx` — render with 3 challenges, filter by category, assert pagination.

## Conventions
- No `repository.ts`/`service.ts` (uses challenge), flat `hooks/` for client logic.
