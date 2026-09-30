# Product plan — Debug Arena

## Current product

Debug Arena is a free debugging practice app. It has no checkout, payment
provider, subscription plan, or paid tier. Challenge submissions are scored by
the configured challenge points and the best graded attempt per challenge.
The leaderboard supports all-time, rolling seven-day, and category rankings.

AI operations currently run on the server through the configured Groq provider
and fall back to deterministic text-overlap grading when AI is unavailable.
There is no persisted vector search or vector database.

## Next: user-configured AI providers

Build a user settings flow that:

1. Lists providers supported by the Vercel AI SDK and lets the user choose one.
2. Lists/selects a model available for that provider.
3. Accepts that provider's API key, encrypts it at rest, and only decrypts and
   uses it inside server-side AI operations. Never return the key to the client.
4. Tracks requests and enforces per-user usage limits before sending provider
   calls, with clear usage feedback and safe behavior when the limit is reached.
5. Keeps the app free of payment flows and paid tiers; provider charges are
   handled by the user's chosen provider account.

Use the AI SDK provider registry or equivalent maintained provider metadata so
provider/model options stay aligned with SDK support. Validate model IDs and
provider credentials server-side; do not trust client-supplied provider or
model identifiers.

## Later product work

- Improve challenge coverage and admin authoring/review workflows.
- Add streaks, achievements, and social features after core scoring is stable.
- Add adaptive hints and weak-spot challenge recommendations.
- Consider log/trace and postmortem-based challenge formats.

## Product questions

- Whether difficulty should adapt to a user's demonstrated performance.
- Which social features are most useful for early users.
