# Data Model (Current Implementation)

Canopy uses raw PostgreSQL tables created lazily by `ensureTables()` in `lib/db.ts`.

## `canopy_waitlist_signups`
- `id` TEXT PK
- `email` TEXT UNIQUE
- `source` TEXT
- UTM fields (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`)
- `created_at`

## `canopy_funnel_events`
- `id` TEXT PK
- `event` TEXT
- `source` TEXT
- `metadata` JSONB
- `created_at`
- index on `(event, created_at)`

## `canopy_youtube_connections`
- `creator_id` TEXT PK
- `channel_id` TEXT
- `channel_title` TEXT
- `subscriber_count` BIGINT
- `access_token` TEXT
- `refresh_token` TEXT nullable
- `token_scope`, `token_type`
- `token_expires_at`
- `recent_videos` JSONB
- `connected_at`, `updated_at`
- index on `channel_id`

## `canopy_youtube_comments`
- composite PK: `(creator_id, comment_id)`
- `channel_id`, `video_id`
- `author`, `text`
- `like_count`
- `published_at`
- `category` (text; values currently toxic/spam/constructive/positive)
- `confidence` NUMERIC(4,3)
- `classifier_method`
- `updated_at`
- indexes:
  - `(creator_id, category)`
  - `(creator_id, video_id)`

## Notes
- No foreign key constraints currently enforced between these tables.
- `creator_id` is cookie-derived identity, not full user account auth yet.
