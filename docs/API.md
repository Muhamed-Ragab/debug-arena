# API Documentation — Debug Arena

Built with NestJS and @ts-rest/core. This outlines the contract boundaries, rate limits, pagination, and endpoints.

## Global Response Shape
All API responses follow a standardized envelope format. Paginated endpoints include a meta property.

`json
{
  "success": boolean,
  "data": any | null,
  "error": string | null,
  "meta": {
    "page": number,
    "limit": number,
    "total": number
  } // OR for cursor pagination: { "nextCursor": "timestamp", "limit": 20 }
}
`

## Global Pagination Strategy

We utilize two distinct pagination strategies depending on the use case to maximize performance and UX:

### 1. Offset/Limit Pagination
**Used for:** Endpoints where users need to jump to specific pages or total page counts are important.
**Parameters:** page (number, default: 1), limit (number, max: 100).
**Response Meta:** { "page": 1, "limit": 20, "total": 145 }
**Endpoints:**
- GET /challenges
- GET /leaderboard

### 2. Cursor-Based Pagination
**Used for:** Infinite scrolling feeds, high-volume time-series data. Prevents UI duplicate items if new rows are inserted during scroll, and avoids the OFFSET database performance penalty on deep pages.
**Parameters:** cursor (ISO Date string), limit (number, max: 100).
**Response Meta:** { "nextCursor": "2024-02-14T12:00:00.000Z", "limit": 20 }
**Endpoints:**
- GET /users/me/recent-submissions
- GET /notifications

## Rate Limiting & DDOS Prevention
We use @nestjs/throttler to prevent abuse. Rate limits vary by endpoint sensitivity.
If exceeded, the API returns 429 Too Many Requests.
Headers included in all responses:
- X-RateLimit-Limit: Total requests allowed in the window.
- X-RateLimit-Remaining: Requests left in the current window.
- X-RateLimit-Reset: Time until the window resets.

---

## 1. Authentication
**Path:** /auth

Auth is provided by **better-auth**. Sessions are opaque httpOnly cookies (`Set-Cookie`); the SPA uses `better-auth/client`. The per-request identity is bridged into Postgres RLS via `request.jwt.claim.sub` (see implementation_guide.md §6).

### POST /auth/register
Creates a new user account.
- **Rate Limit:** 5 requests per 15 minutes (Strict to prevent bot account creation).
- **Body**: { email: string, username: string, password: string }
- **Response 201**: Sets a session cookie; body `{ "success": true, "data": { "user": {...}, "session": {...} }, "error": null }` (exact shape per better-auth).

### POST /auth/login
Authenticates an existing user.
- **Rate Limit:** 10 requests per 15 minutes (Prevents brute force).
- **Body**: { email: string, password: string }
- **Response 200**: Sets a session cookie; body `{ "success": true, "data": { "user": {...}, "session": {...} }, "error": null }` (exact shape per better-auth).

### GET /auth/oauth/:provider
Initiates an OAuth login flow with a supported provider (google, github).
- **Rate Limit:** 10 requests per 15 minutes.
- **Query Params**: redirect (optional) — where to return after the provider redirects back.
- **Response 302**: Redirects to the provider's authorization page. On callback, issues a session cookie and redirects to the app.

### POST /auth/oauth/:provider/callback
Handles the provider's redirect and exchanges the authorization code for a session.
- **Rate Limit:** 10 requests per 15 minutes.
- **Body**: { code: string, state: string }
- **Response 200**: Sets a session cookie; body `{ "success": true, "data": { "user": {...}, "session": {...} }, "error": null }` (exact shape per better-auth).

### GET /auth/sessions
Lists the user's active sessions across devices (multi-session support).
- **Rate Limit:** 30 requests per 1 minute.
- **Response 200**: Returns a list of sessions in data, each with id, device, lastActiveAt, current flag.

### POST /auth/sessions/:id/revoke
Revokes a single active session, forcing logout on that device.
- **Rate Limit:** 30 requests per 1 minute.
- **Response 200**: { "success": true, "data": null, "error": null }

### POST /auth/verify-email
Verifies a user's email address using a token sent by email.
- **Rate Limit:** 10 requests per 15 minutes.
- **Body**: { token: string }
- **Response 200**: { "success": true, "data": null, "error": null }

### POST /auth/resend-verification
Resends the email verification link.
- **Rate Limit:** 5 requests per 15 minutes.
- **Body**: { email: string }
- **Response 200**: { "success": true, "data": null, "error": null }

### POST /auth/forgot-password
Starts the password reset flow by emailing a reset link.
- **Rate Limit:** 5 requests per 15 minutes.
- **Body**: { email: string }
- **Response 200**: { "success": true, "data": null, "error": null }

### POST /auth/reset-password
Completes the password reset using the emailed token.
- **Rate Limit:** 5 requests per 15 minutes.
- **Body**: { token: string, password: string }
- **Response 200**: { "success": true, "data": null, "error": null }

---

## 2. Challenges
**Path:** /challenges

### GET /challenges
Lists available challenges (Offset Paginated).
- **Rate Limit:** 60 requests per 1 minute.
- **Query Params**:
  - page (optional), limit (optional)
  - category (optional): string slug
  - difficulty (optional): asy | medium | hard
- **Response 200**: Returns list in data and { page, limit, total } in meta.

### GET /challenges/:id
Gets full details for a specific challenge.
- **Rate Limit:** 60 requests per 1 minute.

### GET /challenges/search
Semantic search over challenges using RAG over pgvector embeddings.
- **Rate Limit:** 60 requests per 1 minute.
- **Query Params**:
  - q (required): natural-language query string.
  - category (optional): string slug.
  - difficulty (optional): easy | medium | hard.
  - limit (optional, default: 20, max: 100).
- **Notes:** The query is embedded and matched against challenge embeddings stored in Postgres via pgvector (single instance, no separate vector DB). Returns ranked results ordered by cosine similarity in data.

---

## 3. Submissions
**Path:** /submissions

### POST /submissions
Submits a challenge attempt. Triggers validation and async grading (BullMQ).
- **Rate Limit:** 5 requests per 1 minute (Prevents sandbox/LLM abuse).
- **Body**: SubmitAttemptSchema
- **Response 201**: Returns synchronous sandbox status. Full LLM grading is async.

---

## 4. User Profile & Stats
**Path:** /users

### GET /users/me/stats
Gets the user's aggregated stats, radar chart data, and category trends.
- **Rate Limit:** 30 requests per 1 minute.

### GET /users/me/recent-submissions
Lists recent submissions by the user (Cursor Paginated for infinite scroll).
- **Rate Limit:** 30 requests per 1 minute.
- **Query Params**: cursor (timestamp string), limit
- **Response 200**: Returns list in data and { nextCursor, limit } in meta.

### PUT /users/me
Updates the current user's profile (display name, bio, avatar URL).
- **Rate Limit:** 30 requests per 1 minute.
- **Body**: { displayName?: string, bio?: string, avatarUrl?: string }
- **Response 200**: { "success": true, "data": { "id": "...", "displayName": "...", "bio": "...", "avatarUrl": "..." }, "error": null }

### POST /users/me/links
Adds a social or external profile link (GitHub, portfolio, etc.) to the user.
- **Rate Limit:** 30 requests per 1 minute.
- **Body**: { label: string, url: string }
- **Response 201**: { "success": true, "data": { "id": "...", "label": "...", "url": "..." }, "error": null }

---

## 5. Leaderboards
**Path:** /leaderboard

### GET /leaderboard
Gets the current leaderboard (Offset Paginated).
- **Rate Limit:** 30 requests per 1 minute.
- **Query Params**: page, limit, period, category.
- **Response 200**: Returns list in data and { page, limit, total } in meta.

---

## 6. Notifications
**Path:** /notifications

### GET /notifications
Lists the user's recent notifications (Cursor Paginated for infinite scroll).
- **Rate Limit:** 60 requests per 1 minute.
- **Query Params**: cursor (timestamp string), limit
- **Response 200**: Returns list in data and { nextCursor, limit } in meta.

### GET /notifications/stream
SSE (Server-Sent Events) endpoint to stream real-time notifications (achievements, grading completion).
- **Rate Limit:** 5 connections per user.
- **Notes:** Dispatches JSON payloads. Falls back to sending an SMTP Email (via Test SMTP/Ethereal) if the user is offline or has email notifications enabled.
