import { Pool } from "pg";

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function ensureTables() {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS canopy_waitlist_signups (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      source TEXT NOT NULL DEFAULT 'landing-page',
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS canopy_funnel_events (
      id TEXT PRIMARY KEY,
      event TEXT NOT NULL,
      source TEXT,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS canopy_funnel_events_event_created_at_idx
      ON canopy_funnel_events(event, created_at);
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS canopy_youtube_connections (
      creator_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      channel_title TEXT NOT NULL,
      subscriber_count BIGINT,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_scope TEXT,
      token_type TEXT,
      token_expires_at TIMESTAMPTZ,
      recent_videos JSONB NOT NULL DEFAULT '[]'::jsonb,
      connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS canopy_youtube_connections_channel_id_idx
      ON canopy_youtube_connections(channel_id);
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS canopy_youtube_comments (
      creator_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      comment_id TEXT NOT NULL,
      author TEXT NOT NULL,
      text TEXT NOT NULL,
      like_count INTEGER NOT NULL DEFAULT 0,
      published_at TIMESTAMPTZ,
      category TEXT NOT NULL,
      confidence NUMERIC(4,3) NOT NULL DEFAULT 0.5,
      classifier_method TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (creator_id, comment_id)
    );
    CREATE INDEX IF NOT EXISTS canopy_youtube_comments_creator_category_idx
      ON canopy_youtube_comments(creator_id, category);
    CREATE INDEX IF NOT EXISTS canopy_youtube_comments_creator_video_idx
      ON canopy_youtube_comments(creator_id, video_id);
  `);
}

export function db() {
  return getPool();
}
