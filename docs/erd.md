# ERD — Debug Arena (working title)

## Entities

### users
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text unique | |
| username | text unique | |
| password_hash | text | |
| role | enum(user, admin) | |
| current_rating | int | ELO-style skill rating, updated per submission |
| created_at | timestamptz | |

### challenges
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text | |
| category_id | uuid FK -> categories.id | |
| difficulty | enum(easy, medium, hard) | |
| format | enum(code_snippet, log_only, ui_recording) | v1: code_snippet only |
| prompt | text | scenario framing shown to user |
| buggy_artifact | jsonb | code files, or log dump, or video URL — shape depends on format |
| reference_fix | jsonb | canonical corrected code/diff, used by grader as ground truth |
| root_cause_summary | text | canonical explanation, embedded via pgvector for semantic grading |
| root_cause_embedding | vector(1536) | pgvector column, cosine similarity search against user explanations |
| prevention_notes | text | canonical "how to avoid this class of bug" |
| source | enum(manual, ai_generated, postmortem_import) | |
| status | enum(draft, published, archived) | |
| created_at | timestamptz | |

### categories
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | e.g. "React rendering", "Backend concurrency" |
| slug | text unique | |
| description | text | |

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
| fix_correct | boolean | from automated test run against reference_fix |
| prevention_answer | text | optional bonus step |
| prevention_score | int | optional |
| hints_used | int | count, affects max score |
| total_score | int | weighted composite |
| time_spent_seconds | int | |
| created_at | timestamptz | |

### hints
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| challenge_id | uuid FK -> challenges.id | |
| order | int | sequence within a challenge |
| socratic_prompt | text | e.g. "what happens the second time this component mounts?" |
| penalty_points | int | deducted from total_score if used |

### bug_injection_jobs
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| source_repo_url | text | reference repo the agent injects a bug into |
| category_id | uuid FK -> categories.id | requested category |
| difficulty | enum(easy, medium, hard) | requested difficulty |
| status | enum(queued, running, succeeded, failed) | BullMQ job status |
| generated_challenge_id | uuid FK -> challenges.id, nullable | set on success |
| error_message | text, nullable | |
| created_at | timestamptz | |

### user_category_stats
| Field | Type | Notes |
|---|---|---|
| user_id | uuid FK -> users.id | |
| category_id | uuid FK -> categories.id | |
| attempts | int | |
| avg_score | int | |
| weak_spot_rank | int | computed, drives adaptive routing | 
| PK | (user_id, category_id) | |

### leaderboard_entries (materialized view or scheduled rollup)
| Field | Type | Notes |
|---|---|---|
| user_id | uuid FK -> users.id | |
| period | enum(weekly, all_time) | |
| rank | int | |
| total_score | int | |

## Relationships
- `categories` 1—N `challenges`
- `challenges` 1—N `hints`
- `challenges` 1—N `submissions`
- `users` 1—N `submissions`
- `users` 1—N `user_category_stats` (via `categories`)
- `bug_injection_jobs` 1—1 `challenges` (nullable, set once generation succeeds)
- `submissions.root_cause_embedding` compared against `challenges.root_cause_embedding` via pgvector cosine distance for the grading agent's semantic-similarity pass (combined with LLM judge score, not a replacement for it)

## Notes on pgvector usage
- Single Postgres instance handles both relational data and embeddings — no separate vector DB service to run/scale (this replaces the earlier Qdrant plan).
- Use `ivfflat` or `hnsw` index on `root_cause_embedding` columns once challenge count grows past a few hundred; fine as a flat scan at MVP scale.
- Embeddings generated via the same AI SDK call used for grading, stored alongside the submission for future weak-spot analysis and duplicate-challenge detection.
