import { cookies } from "next/headers";
import Link from "next/link";
import { db, ensureTables } from "@/lib/db";
import { fetchChannelSummary, fetchVideosWithStats, refreshAccessToken, type YouTubeVideoWithStats } from "@/lib/youtube";
import type { CommentCategory } from "@/lib/comment-classifier";

type ConnectionRow = {
  creator_id: string;
  channel_id: string;
  channel_title: string;
  subscriber_count: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
};

type StoredComment = {
  comment_id: string;
  author: string;
  text: string;
  category: CommentCategory;
  confidence: string | number;
  classifier_method: string;
};

function formatNumber(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat().format(n);
}

function formatCategoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

async function loadConnection() {
  const cookieStore = await cookies();
  const creatorId = cookieStore.get("canopy_creator_id")?.value;
  if (!creatorId) return null;

  await ensureTables();
  const result = await db().query(
    `SELECT creator_id, channel_id, channel_title, subscriber_count, access_token, refresh_token, token_expires_at
     FROM canopy_youtube_connections
     WHERE creator_id = $1`,
    [creatorId]
  );

  return (result.rows[0] as ConnectionRow | undefined) ?? null;
}

async function ensureValidToken(connection: ConnectionRow): Promise<string> {
  const tokenExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
  const isExpired = tokenExpiresAt ? tokenExpiresAt.getTime() < Date.now() + 30_000 : false;

  if (!isExpired) return connection.access_token;
  if (!connection.refresh_token) return connection.access_token;

  const refreshed = await refreshAccessToken(connection.refresh_token);
  const expiresAt = new Date(Date.now() + Number(refreshed.expires_in ?? 0) * 1000);

  await db().query(
    `UPDATE canopy_youtube_connections
     SET access_token = $1,
         token_scope = COALESCE($2, token_scope),
         token_type = $3,
         token_expires_at = $4,
         updated_at = NOW()
     WHERE creator_id = $5`,
    [refreshed.access_token, refreshed.scope ?? null, refreshed.token_type, expiresAt.toISOString(), connection.creator_id]
  );

  return refreshed.access_token;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ video?: string; category?: string; connected?: string; fetched?: string; videos?: string; channel?: string }>;
}) {
  const params = await searchParams;
  const connection = await loadConnection();

  if (!connection) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-6 py-12 text-[#1F2C24]">
        <h1 className="text-3xl font-semibold">Canopy</h1>
        <p className="mt-3 text-[#4D5E52]">Connect your YouTube channel first to load comments and classification insights.</p>
        <a href="/api/youtube/connect" className="mt-6 inline-flex rounded-md bg-[#355F44] px-5 py-3 font-semibold text-white">
          Connect YouTube
        </a>
      </main>
    );
  }

  let error = "";
  let videos: YouTubeVideoWithStats[] = [];
  let storedComments: StoredComment[] = [];

  try {
    const accessToken = await ensureValidToken(connection);
    const latestChannel = await fetchChannelSummary(accessToken);

    await db().query(
      `UPDATE canopy_youtube_connections
       SET channel_title = $1,
           subscriber_count = $2,
           recent_videos = $3::jsonb,
           updated_at = NOW()
       WHERE creator_id = $4`,
      [latestChannel.channelTitle, latestChannel.subscriberCount, JSON.stringify(latestChannel.videos), connection.creator_id]
    );

    videos = await fetchVideosWithStats(accessToken, connection.channel_id, 8);

    const selectedVideo = params.video ?? videos[0]?.id;
    const selectedCategory = (params.category as CommentCategory | undefined) ?? "toxic";

    const commentsQuery = await db().query(
      `SELECT comment_id, author, text, category, confidence, classifier_method
       FROM canopy_youtube_comments
       WHERE creator_id = $1
         AND ($2::text = '' OR video_id = $2)
         AND category = $3
       ORDER BY published_at DESC NULLS LAST
       LIMIT 120`,
      [connection.creator_id, selectedVideo ?? "", selectedCategory]
    );
    storedComments = commentsQuery.rows as StoredComment[];
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load dashboard data";
  }

  const countsResult = await db().query(
    `SELECT category, COUNT(*)::int AS count
     FROM canopy_youtube_comments
     WHERE creator_id = $1
       AND ($2::text = '' OR video_id = $2)
     GROUP BY category`,
    [connection.creator_id, params.video ?? videos[0]?.id ?? ""]
  );

  const counts: Record<CommentCategory, number> = {
    toxic: 0,
    spam: 0,
    constructive: 0,
    positive: 0,
  };

  for (const row of countsResult.rows as Array<{ category: CommentCategory; count: number }>) {
    if (row.category in counts) counts[row.category] = Number(row.count ?? 0);
  }

  const total = counts.toxic + counts.spam + counts.constructive + counts.positive;
  const percentages: Record<CommentCategory, number> = {
    toxic: total ? Math.round((counts.toxic / total) * 100) : 0,
    spam: total ? Math.round((counts.spam / total) * 100) : 0,
    constructive: total ? Math.round((counts.constructive / total) * 100) : 0,
    positive: total ? Math.round((counts.positive / total) * 100) : 0,
  };

  const selectedCategory = (params.category as CommentCategory | undefined) ?? "toxic";
  const selectedVideo = params.video ?? videos[0]?.id ?? "";

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-8 px-6 py-10 text-[#1F2C24]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#4D5E52]">Connected channel</p>
          <h1 className="text-3xl font-semibold">{connection.channel_title}</h1>
          <p className="text-sm text-[#4D5E52]">{formatNumber(connection.subscriber_count)} subscribers</p>
        </div>
        <Link href="/" className="rounded-md border border-[#355F44]/30 px-4 py-2 text-sm font-medium text-[#355F44]">
          Back to home
        </Link>
      </div>

      {params.connected === "1" ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <p className="font-semibold">YouTube connected: {params.channel ?? connection.channel_title}</p>
          <p className="text-sm">Fetching complete — found {formatNumber(params.fetched)} comments across {formatNumber(params.videos)} videos. Your dashboard is ready.</p>
        </section>
      ) : null}

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</p> : null}

      <section className="rounded-2xl border border-[#355F44]/15 bg-white p-5">
        <h2 className="text-lg font-semibold text-[#355F44]">Comment overview</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["toxic", percentages.toxic],
            ["spam", percentages.spam],
            ["constructive", percentages.constructive],
            ["positive", percentages.positive],
          ] as Array<[CommentCategory, number]>).map(([category, pct]) => (
            <div key={category} className="rounded-lg border border-[#355F44]/15 bg-[#FAF9F5] p-3">
              <p className="text-xs tracking-wide text-[#4D5E52]">{formatCategoryLabel(category)}</p>
              <p className="text-2xl font-semibold">{pct}%</p>
              <p className="text-xs text-[#4D5E52]">{counts[category]} comments</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#355F44]/15 bg-white p-5">
        <h2 className="text-lg font-semibold text-[#355F44]">Recent videos with comment counts</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {videos.map((video) => (
            <li key={video.id} className="rounded-lg border border-[#355F44]/15 p-4">
              <p className="font-medium">{video.title}</p>
              <p className="mt-1 text-sm text-[#4D5E52]">
                {new Date(video.publishedAt).toLocaleDateString()} · {formatNumber(video.commentCount)} comments · {formatNumber(video.viewCount)} views
              </p>
              <div className="mt-3 flex gap-2 text-xs">
                <Link
                  href={`/dashboard?video=${encodeURIComponent(video.id)}&category=${encodeURIComponent(selectedCategory)}`}
                  className="rounded border border-[#355F44]/30 px-2 py-1 text-[#355F44]"
                >
                  View comments
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[#355F44]/15 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#355F44]">Comment review</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {(["toxic", "spam", "constructive", "positive"] as CommentCategory[]).map((category) => (
              <Link
                key={category}
                href={`/dashboard?video=${encodeURIComponent(selectedVideo)}&category=${category}`}
                className={`rounded-full px-3 py-1 ${
                  selectedCategory === category ? "bg-[#355F44] text-white" : "border border-[#355F44]/30 text-[#355F44]"
                }`}
              >
                {formatCategoryLabel(category)}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {storedComments.map((comment) => (
            <article key={comment.comment_id} className="rounded-lg border border-[#355F44]/15 bg-[#FAF9F5] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{comment.author}</p>
                <p className="text-xs text-[#4D5E52]">{Math.round(Number(comment.confidence) * 100)}% · {comment.classifier_method}</p>
              </div>
              <p className="mt-2 text-sm">{comment.text}</p>
            </article>
          ))}
          {!storedComments.length ? <p className="text-sm text-[#4D5E52]">Nothing in this category for this video right now.</p> : null}
        </div>
      </section>
    </main>
  );
}
