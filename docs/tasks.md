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

## User-configured AI (BYOK) & Multi-Model Engine

- [x] Let users choose a provider supported by the Vercel AI SDK (Anthropic, OpenAI, Groq, Google Gemini)
- [x] Let users select a model offered by their chosen provider
- [x] Store provider keys encrypted at rest (AES-256-GCM); decrypt and use them only in server-side AI operations
- [x] Track and enforce per-user AI usage limits (5 RPM / 15 daily platform, 30 RPM unmetered BYOK) before provider calls
- [x] Explain remaining usage and limit behavior in user settings with live connection testing and workspace model badges

## Feature Roadmap

### 1. Authentic SRE & Investigation Experience
- [ ] **Interactive "Fix & Test" Sandbox**: Embed code editor (Monaco/CodeMirror) in Challenge "Fix" tab with real-time test execution against sandbox prior to submission
- [ ] **"On-Call Incident Mode" (`log_only`)**: Dedicated terminal/telemetry triage UI displaying raw server logs, HTTP request timelines, and APM error/latency spikes for root-cause diagnosis without source code
- [ ] **Multi-File Project Workspace**: File-tree navigation and tabbed file viewing for challenges spanning multiple source files

### 2. AI & Personalized Mentorship
- [ ] **Socratic AI "Rubber Duck" Mentor**: Interactive in-workspace debugging mentor providing guidance and counter-questions without spoiling solutions
- [ ] **Targeted On-Call Shift**: Automated weak-spot practice queue surfacing challenges based on user category radar weak points

### 3. Retention & Habit Formation
- [ ] **"Incident of the Day" (Daily Challenge)**: Curated daily challenge with streak tracking, bonus rank points, and GitHub-style activity heatmap on user profile
- [ ] **Community Postmortems & Solutions**: Post-solve discussion space where engineers who solved the challenge can share postmortem writeups, discuss architectural mitigations, and vote

### 4. Competitive & Community Growth
- [ ] **1v1 Speed Debug Duels**: Synchronous or async competitive debugging match mode with Elo rating system
- [ ] **Community Challenge Submissions**: Pipeline for users to submit sanitized real-world production bugs with test suites, subject to admin review

## Later

- [ ] Review sandbox isolation and resource limits for production deployment
- [ ] Improve challenge authoring and review workflows
