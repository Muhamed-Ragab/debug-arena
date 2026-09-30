# Application API

Debug Arena is a Next.js App Router application. Most authenticated product
operations are exposed as server actions rather than a separate REST API.
This page records the HTTP routes that are currently implemented and points to
the feature action modules for the rest of the app.

## HTTP routes

| Method | Path | Purpose |
|---|---|---|
| `GET`, `POST` | `/api/auth/*` | better-auth session, sign-in, sign-up, OAuth, and account operations. These responses use better-auth's native response shapes. |
| `GET` | `/api/health` | Application health status. |
| `POST` | `/api/admin/users/ban` | Admin-only user ban action. |

There is no REST challenge search endpoint. Challenge browsing uses the
browser feature's paginated server action and database filters. The application
does not run semantic/vector search or a vector database.

## Server actions

Feature operations are implemented and validated in these modules:

- `src/features/challenge/actions.ts` — challenge retrieval, submission,
  grading, and hints.
- `src/features/leaderboard/actions.ts` — authenticated leaderboard data;
  accepts a `weekly` or `all_time` period and an optional category slug.
- `src/features/profile/actions.ts` — profile and submission history.
- `src/features/category/actions.ts` — category management.
- `src/features/admin/actions.ts` — admin challenge and user management.

Actions use `next-safe-action` clients with Zod input and output schemas. Their
client-visible result shape is managed by the action client, not by the HTTP
API envelope described in older versions of this document. Auth endpoints are
the exception and keep better-auth's native contract.

## Scoring

Challenge points are calculated from the best graded attempt for each
challenge. The challenge's configured `buggyArtifact.points` value sets its
maximum (with a 100/200/300 fallback for easy/medium/hard); the submission's
0–100 score determines the proportional award. The leaderboard's weekly view
covers the previous seven days, and category tabs rank submissions for that
category only.

## AI configuration roadmap

The current server uses the configured Groq provider. A planned user-owned AI
settings feature will let each user choose a provider supported by the Vercel
AI SDK, select a model offered by that provider, and save their provider API
key. Keys must be encrypted at rest and used server-side only. Usage limits
will cap AI requests; this does not introduce app-level payments or paid
tiers.
