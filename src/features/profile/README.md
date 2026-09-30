# Profile feature

Profile pages aggregate account settings, recent submissions, solved
challenges, points, category strength, and leaderboard rank.

## Points and stats

Profile totals use the same shared scoring helpers as the leaderboard.
Submissions are grouped by challenge and only the best attempt contributes
points. The challenge's configured `buggyArtifact.points` value is the maximum;
if it is absent, easy/medium/hard challenges use 100/200/300 points. A score
from 0 to 100 earns the same proportion of those points. Solved challenges
count once per challenge when the fix is correct or the score is at least 60.

## File map

| File | Role |
|---|---|
| `repository.ts` | Profile, account, and related submission database access |
| `service.ts` | Profile aggregation and shared scoring calculations |
| `actions.ts` | Validated server-action facade |
| `constants.ts` | Avatar presets and category defaults |
| `types.ts` | Profile DTOs and repository types |
| `components/` | Profile screens, charts, settings, and account controls |

Run `pnpm exec vitest run src/features/profile/service.test.ts` for profile
service tests and `pnpm exec vitest run src/lib/domain/scoring.test.ts` for
shared scoring rules.
