# Current tasks — Debug Arena

The app is a single Next.js 16 application using Drizzle/Postgres, better-auth,
next-safe-action, the Vercel AI SDK, and an English-only interface. It is free to use and has no
payment integration. This checklist reflects the current app; older migration
notes are kept in `docs/superpowers/` as historical records.

## Current capabilities

- [x] Authentication, protected routes, and profile/account settings
- [x] Challenge browsing, challenge studio, submissions, sandbox checks, and
      AI-assisted grading with deterministic fallback
- [x] Profile aggregation and leaderboard scoring from configured challenge
      points and best attempt per challenge
- [x] Weekly, all-time, and category leaderboard filters
- [x] Remove runtime vector storage/search; migrate existing databases and let
      fresh Postgres installs replay migrations without the vector extension
- [x] Keep the app free with no checkout, subscriptions, or paid tiers

## Next: user-configured AI

- [ ] Let users choose a provider supported by the Vercel AI SDK
- [ ] Let users select a model offered by their chosen provider
- [ ] Store provider keys encrypted at rest; decrypt and use them only in
      server-side AI operations
- [ ] Track and enforce per-user AI usage limits before provider calls
- [ ] Explain remaining usage and limit behavior in user settings

## Later

- [ ] Review sandbox isolation and resource limits for production deployment
- [ ] Improve challenge authoring and review workflows
- [ ] Add achievements, useful streaks, and social ranking options
- [ ] Explore adaptive hints and weak-spot recommendations
