## Global Pagination Strategy

We utilize two distinct pagination strategies depending on the use case to maximize performance and UX:

### 1. Offset/Limit Pagination
**Used for:** Endpoints where users need to jump to specific pages or total page counts are important.
**Parameters:** page (number), limit (number).
**Response Meta:** { "page": 1, "limit": 20, "total": 145 }
**Endpoints:**
- GET /challenges (Users want to browse specific challenge pages)
- GET /leaderboard (Users need to jump to specific rank pages, e.g., Page 5 for Ranks 100-120)

### 2. Cursor-Based Pagination
**Used for:** Infinite scrolling feeds, high-volume time-series data. Prevents UI duplicate items if new rows are inserted during scroll, and avoids the OFFSET database performance penalty on deep pages.
**Parameters:** cursor (ISO Date string or ID), limit (number).
**Response Meta:** { "nextCursor": "2024-02-14T12:00:00Z", "limit": 20 }
**Endpoints:**
- GET /users/me/recent-submissions (Infinite scroll of user's past attempts)
- GET /notifications (Infinite scroll of activity feed)

---
