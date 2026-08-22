# ERD — Debug Arena

## Entities

### users
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text unique | |
| username | text unique | |
| password_hash | text nullable | null for OAuth-only accounts |
| email_verified_at | timestamptz nullable | set when email confirmed |
| display_name | text nullable | public display name |
| bio | text nullable | short user bio |
| avatar_url | text nullable | profile avatar URL |
| role | enum(user, admin) | |
| current_rating | int | ELO-style skill rating, updated per submission |
| streak_count | int | Current daily active streak |
| last_activity_date | date | To compute streak continuity |
| created_at | timestamptz | |

### oauth_accounts
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK -> users.id | |
| provider | text | e.g. "google", "github" |
| provider_account_id | text | provider's user/account id |
| access_token | text nullable | OAuth access token |
| refresh_token | text nullable | OAuth refresh token |

### sessions
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK -> users.id | |
| refresh_token_hash | text | hashed refresh token for rotation |
| user_agent | text nullable | client user agent |
| ip_address | inet nullable | client IP |
| status | enum(active, revoked) | |
| expires_at | timestamptz | |

### login_attempts
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text | attempted login email |
| ip_address | inet | source IP |
| attempt_count | int | failed attempts in window |
| locked_until | timestamptz nullable | lockout expiry |

### email_verifications
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK -> users.id | |
| token_hash | text | hashed verification token |
| expires_at | timestamptz | |

### password_resets
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK -> users.id | |
| token_hash | text | hashed reset token |
| expires_at | timestamptz | |

### profile_links
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK -> users.id | |
| platform | text | e.g. "github", "twitter" |
| url | text | external profile URL |

### email_templates
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text unique | template key, e.g. "verify_email" |
| subject | text | email subject line |
| body_html | text | HTML email body |
| body_text | text | plain-text email body |

### challenge_embeddings
| Field | Type | Notes |
|---|---|---|
| challenge_id | uuid FK -> challenges.id | |
| model | text | embedding model name |
| content_hash | text | hash of source text |
| search_text | text | text indexed for RAG search |
| embedding | vector(1536) | pgvector embedding for RAG retrieval |
| PK | (challenge_id, model) | |

### categories
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "React rendering", "Backend concurrency" |
| slug | text unique | |
| description | text | |

### challenges
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text | |
| category_id | uuid FK -> categories.id | |
| difficulty | enum(easy, medium, hard) | |
| format | enum(code_snippet, log_only, ui_recording) | |
| prompt | text | scenario framing shown to user |
| buggy_artifact | jsonb | code files, or log dump, or video URL |
| reference_fix | jsonb | canonical corrected code/diff |
| root_cause_summary | text | canonical explanation |
| root_cause_embedding | vector(1536) | pgvector column for semantic grading |
| prevention_notes | text | canonical "how to avoid this class of bug" |
| source | enum(manual, ai_generated, postmortem_import) | |
| status | enum(draft, published, archived) | |
| created_at | timestamptz | |

### hints
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| challenge_id | uuid FK -> challenges.id | |
| order | int | sequence within a challenge |
| socratic_prompt | text | |
| penalty_points | int | deducted from total_score if used |

### submissions
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK -> users.id | |
| challenge_id | uuid FK -> challenges.id | |
| localization_answer | text | which file/function/component the user identified |
| localization_correct | boolean | |
| root_cause_explanation | text | free-text user explanation |
| root_cause_embedding | vector(1536) | pgvector, computed on submit |
| root_cause_score | int | 0–100, from grading agent |
| proposed_fix | jsonb | code/diff the user submitted |
| fix_correct | boolean | from automated test run |
| prevention_answer | text | optional bonus step |
| prevention_score | int | optional |
| hints_used | int | count, affects max score |
| total_score | int | weighted composite |
| time_spent_seconds | int | |
| created_at | timestamptz | |

### bug_injection_jobs
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| source_repo_url | text | reference repo the agent injects a bug into |
| category_id | uuid FK -> categories.id | requested category |
| difficulty | enum(easy, medium, hard) | requested difficulty |
| status | enum(queued, running, succeeded, failed) | BullMQ job status |
| generated_challenge_id | uuid FK -> challenges.id | nullable, set on success |
| error_message | text | nullable |
| created_at | timestamptz | |

### user_category_stats
| Field | Type | Notes |
|---|---|---|
| user_id | uuid FK -> users.id | |
| category_id | uuid FK -> categories.id | |
| attempts | int | |
| avg_score | int | |
| avg_time_seconds | int | Tracked for profile metrics |
| root_cause_accuracy_percent | int | Profile trend tracking |
| trend | enum(improving, flat, weak_spot) | Computed based on recent submissions |
| weak_spot_rank | int | computed, drives adaptive routing | 
| PK | (user_id, category_id) | |

### leaderboard_entries
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK -> users.id | |
| category_id | uuid FK -> categories.id | nullable (null = global all categories) |
| period | enum(weekly, all_time) | |
| rank | int | |
| total_score | int | |

### notifications
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK -> users.id | |
| type | enum(achievement, challenge, social, system) | |
| title | text | |
| description | text | |
| is_read | boolean | default false |
| created_at | timestamptz | |

### achievements
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g., "Bug Slayer" |
| description | text | e.g., "Solved 10 concurrency bugs in a row." |
| icon_name | text | Reference to UI icon |

### user_achievements
| Field | Type | Notes |
|---|---|---|
| user_id | uuid FK -> users.id | |
| achievement_id | uuid FK -> achievements.id | |
| earned_at | timestamptz | |
| PK | (user_id, achievement_id) | |

### followers
| Field | Type | Notes |
|---|---|---|
| follower_id | uuid FK -> users.id | User doing the following |
| following_id | uuid FK -> users.id | User being followed |
| created_at | timestamptz | |
| PK | (follower_id, following_id) | |

## Relationships
- `categories` 1—N `challenges`
- `challenges` 1—N `hints`
- `challenges` 1—N `submissions`
- `users` 1—N `submissions`
- `users` 1—N `user_category_stats`
- `users` 1—N `notifications`
- `users` 1—N `user_achievements`
- `achievements` 1—N `user_achievements`
- `bug_injection_jobs` 1—1 `challenges`
- `submissions.root_cause_embedding` vs `challenges.root_cause_embedding` via pgvector for semantic-similarity pass.
- `users` 1—N `oauth_accounts`
- `users` 1—N `sessions`
- `users` 1—N `email_verifications`
- `users` 1—N `password_resets`
- `users` 1—N `profile_links`
- `challenges` 1—N `challenge_embeddings` (RAG search via pgvector)
- `login_attempts` keyed by `email`/`ip_address` for rate limiting (no FK to users, supports pre-account attempts).
