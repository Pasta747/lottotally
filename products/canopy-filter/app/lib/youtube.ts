const GOOGLE_OAUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

export type YouTubeVideoSummary = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string | null;
};

export type YouTubeVideoWithStats = YouTubeVideoSummary & {
  commentCount: number;
  viewCount: number;
};

export type YouTubeComment = {
  commentId: string;
  author: string;
  text: string;
  likeCount: number;
  publishedAt: string;
  videoId: string;
};

function requireAnyEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`Missing one of: ${names.join(", ")}`);
}

export function getGoogleOAuthConfig() {
  const clientId = requireAnyEnv(["GOOGLE_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_ID"]);
  const clientSecret = requireAnyEnv(["GOOGLE_CLIENT_SECRET", "GOOGLE_OAUTH_CLIENT_SECRET"]);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.CANOPY_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const redirectUri = `${appUrl}/api/youtube/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function buildYouTubeAuthUrl(state: string) {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  const url = new URL(GOOGLE_OAUTH_BASE);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", YOUTUBE_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Token exchange failed: ${payload?.error ?? res.statusText}`);

  return payload as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Token refresh failed: ${payload?.error ?? res.statusText}`);

  return payload as {
    access_token: string;
    expires_in: number;
    scope?: string;
    token_type: string;
  };
}

export async function fetchChannelSummary(accessToken: string) {
  const channelRes = await fetch(
    `${YOUTUBE_API_BASE}/channels?part=snippet,statistics,contentDetails&mine=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  const channelPayload = await channelRes.json().catch(() => ({}));
  if (!channelRes.ok) {
    throw new Error(`YouTube channels.list failed: ${channelPayload?.error?.message ?? channelRes.statusText}`);
  }

  const channel = channelPayload?.items?.[0];
  if (!channel) throw new Error("No YouTube channel found for this account");

  const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;
  let videos: YouTubeVideoSummary[] = [];

  if (uploadsPlaylistId) {
    videos = await fetchVideosFromUploadsPlaylist(accessToken, uploadsPlaylistId, 5);
  }

  return {
    channelId: channel.id as string,
    channelTitle: channel?.snippet?.title as string,
    subscriberCount: channel?.statistics?.subscriberCount ? String(channel.statistics.subscriberCount) : "0",
    videos,
  };
}

async function fetchVideosFromUploadsPlaylist(accessToken: string, playlistId: string, maxResults: number) {
  const videosRes = await fetch(
    `${YOUTUBE_API_BASE}/playlistItems?part=snippet&playlistId=${encodeURIComponent(playlistId)}&maxResults=${maxResults}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  const videosPayload = await videosRes.json().catch(() => ({}));
  if (!videosRes.ok) return [];

  return (videosPayload?.items ?? [])
    .map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => ({
      id: item?.snippet?.resourceId?.videoId ?? "",
      title: item?.snippet?.title ?? "Untitled video",
      publishedAt: item?.snippet?.publishedAt ?? "",
      thumbnail: item?.snippet?.thumbnails?.medium?.url ?? item?.snippet?.thumbnails?.default?.url ?? null,
    }))
    .filter((video: YouTubeVideoSummary) => Boolean(video.id));
}

export async function fetchVideosWithStats(accessToken: string, channelId: string, maxResults = 8): Promise<YouTubeVideoWithStats[]> {
  const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("maxResults", String(maxResults));
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("type", "video");

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const searchPayload = await searchRes.json().catch(() => ({}));
  if (!searchRes.ok) {
    throw new Error(`YouTube search failed: ${searchPayload?.error?.message ?? searchRes.statusText}`);
  }

  const videos = (searchPayload?.items ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => ({
    id: item?.id?.videoId ?? "",
    title: item?.snippet?.title ?? "Untitled video",
    publishedAt: item?.snippet?.publishedAt ?? "",
    thumbnail: item?.snippet?.thumbnails?.medium?.url ?? item?.snippet?.thumbnails?.default?.url ?? null,
  })).filter((video: YouTubeVideoSummary) => Boolean(video.id));

  if (!videos.length) return [];

  const statsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
  statsUrl.searchParams.set("part", "statistics");
  statsUrl.searchParams.set("id", videos.map((v: YouTubeVideoSummary) => v.id).join(","));

  const statsRes = await fetch(statsUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const statsPayload = await statsRes.json().catch(() => ({}));

  const statsById = new Map<string, { commentCount: number; viewCount: number }>();
  if (statsRes.ok) {
    for (const item of statsPayload?.items ?? []) {
      statsById.set(item.id, {
        commentCount: Number(item?.statistics?.commentCount ?? 0),
        viewCount: Number(item?.statistics?.viewCount ?? 0),
      });
    }
  }

  return videos.map((video: YouTubeVideoSummary) => ({
    ...video,
    commentCount: statsById.get(video.id)?.commentCount ?? 0,
    viewCount: statsById.get(video.id)?.viewCount ?? 0,
  }));
}

export async function fetchVideoComments(accessToken: string, videoId: string, maxResults = 40): Promise<YouTubeComment[]> {
  const url = new URL(`${YOUTUBE_API_BASE}/commentThreads`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("videoId", videoId);
  url.searchParams.set("maxResults", String(Math.min(Math.max(maxResults, 1), 100)));
  url.searchParams.set("textFormat", "plainText");
  url.searchParams.set("order", "time");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`YouTube comments failed: ${payload?.error?.message ?? res.statusText}`);
  }

  return (payload?.items ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => {
    const c = item?.snippet?.topLevelComment?.snippet ?? {};
    return {
      commentId: item?.snippet?.topLevelComment?.id ?? "",
      author: c?.authorDisplayName ?? "Unknown",
      text: c?.textDisplay ?? "",
      likeCount: Number(c?.likeCount ?? 0),
      publishedAt: c?.publishedAt ?? "",
      videoId,
    };
  }).filter((row: YouTubeComment) => Boolean(row.commentId));
}

export async function fetchChannelComments(accessToken: string, channelId: string, maxResults = 200): Promise<YouTubeComment[]> {
  const cap = Math.min(Math.max(maxResults, 1), 500);
  const comments: YouTubeComment[] = [];
  let pageToken: string | undefined;

  while (comments.length < cap) {
    const batchSize = Math.min(100, cap - comments.length);
    const url = new URL(`${YOUTUBE_API_BASE}/commentThreads`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("allThreadsRelatedToChannelId", channelId);
    url.searchParams.set("maxResults", String(batchSize));
    url.searchParams.set("textFormat", "plainText");
    url.searchParams.set("order", "time");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`YouTube channel comments failed: ${payload?.error?.message ?? res.statusText}`);
    }

    const rows = (payload?.items ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => {
      const c = item?.snippet?.topLevelComment?.snippet ?? {};
      return {
        commentId: item?.snippet?.topLevelComment?.id ?? "",
        author: c?.authorDisplayName ?? "Unknown",
        text: c?.textDisplay ?? "",
        likeCount: Number(c?.likeCount ?? 0),
        publishedAt: c?.publishedAt ?? "",
        videoId: item?.snippet?.videoId ?? "",
      };
    }).filter((row: YouTubeComment) => Boolean(row.commentId && row.videoId));

    comments.push(...rows);
    pageToken = payload?.nextPageToken;
    if (!pageToken || rows.length === 0) break;
  }

  return comments;
}
