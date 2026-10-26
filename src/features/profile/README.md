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
| `repository.ts` | Profile, account, user API keys, AI settings, and submission database access |
| `service.ts` | Profile aggregation, AI configuration, and shared scoring calculations |
| `actions.ts` | Validated server-action facade (profile, linked accounts, BYOK keys, AI settings) |
| `constants.ts` | Avatar presets and category defaults |
| `types.ts` | Profile DTOs, AI configuration types, and repository interfaces |
| `components/` | Profile screens, charts, settings, AI & API keys manager, and account controls |

## Bring Your Own Key (BYOK) & Multi-Model Engine

Users can configure custom API keys for external providers (OpenAI, Anthropic, Groq, Google Gemini):
- API keys are encrypted at rest with AES-256-GCM using `AI_ENCRYPTION_SECRET`.
- Only masked previews (`sk-...4a2b`) are stored in `user_api_keys.key_preview` or surfaced to the frontend.
- Active provider and model selection is managed via `user_ai_settings`.
- Platform users receive 5 RPM and 15 daily evaluations; BYOK users receive 30 RPM and unmetered evaluations.

Run `pnpm exec vitest run src/features/profile/service.test.ts` for profile
service tests and `pnpm exec vitest run src/lib/domain/scoring.test.ts` for
shared scoring rules.
