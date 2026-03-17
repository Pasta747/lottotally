import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db, ensureTables } from "@/lib/db";
import { classifyComments } from "@/lib/comment-classifier";
import { exchangeCodeForTokens, fetchChannelComments, fetchChannelSummary } from "@/lib/youtube";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(new URL(`/?youtube_error=${encodeURIComponent(oauthError)}`, url.origin));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/?youtube_error=missing_code_or_state", url.origin));
    }

    const cookieStore = await cookies();
    const stateCookie = cookieStore.get("canopy_youtube_oauth_state")?.value;
    const creatorId = cookieStore.get("canopy_creator_id")?.value;

    if (!creatorId || !stateCookie || stateCookie !== state) {
      return NextResponse.redirect(new URL("/?youtube_error=state_validation_failed", url.origin));
    }

    const tokens = await exchangeCodeForTokens(code);
    const channel = await fetchChannelSummary(tokens.access_token);

    await ensureTables();

    const expiresAt = new Date(Date.now() + Number(tokens.expires_in ?? 0) * 1000);

    await db().query(
      `INSERT INTO canopy_youtube_connections (
          creator_id, channel_id, channel_title, subscriber_count,
          access_token, refresh_token, token_scope, token_type, token_expires_at, recent_videos, updated_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,NOW())
       ON CONFLICT (creator_id) DO UPDATE SET
          channel_id = EXCLUDED.channel_id,
          channel_title = EXCLUDED.channel_title,
          subscriber_count = EXCLUDED.subscriber_count,
          access_token = EXCLUDED.access_token,
          refresh_token = COALESCE(EXCLUDED.refresh_token, canopy_youtube_connections.refresh_token),
          token_scope = EXCLUDED.token_scope,
          token_type = EXCLUDED.token_type,
          token_expires_at = EXCLUDED.token_expires_at,
          recent_videos = EXCLUDED.recent_videos,
          updated_at = NOW()`,
      [
        creatorId,
        channel.channelId,
        channel.channelTitle,
        channel.subscriberCount,
        tokens.access_token,
        tokens.refresh_token ?? null,
        tokens.scope,
        tokens.token_type,
        expiresAt.toISOString(),
        JSON.stringify(channel.videos),
      ]
    );

    const fetchedComments = await fetchChannelComments(tokens.access_token, channel.channelId, 250);
    const classified = await classifyComments(fetchedComments);

    if (classified.length > 0) {
      const valuesSql: string[] = [];
      const params: Array<string | number | null> = [];

      classified.forEach((comment, index) => {
        const base = index * 11;
        valuesSql.push(
          `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},NOW())`
        );
        params.push(
          creatorId,
          channel.channelId,
          comment.videoId,
          comment.commentId,
          comment.author,
          comment.text,
          comment.likeCount,
          comment.publishedAt ? new Date(comment.publishedAt).toISOString() : null,
          comment.category,
          Number(comment.confidence.toFixed(3)),
          comment.method
        );
      });

      await db().query(
        `INSERT INTO canopy_youtube_comments (
          creator_id, channel_id, video_id, comment_id, author, text,
          like_count, published_at, category, confidence, classifier_method, updated_at
        ) VALUES ${valuesSql.join(",")}
        ON CONFLICT (creator_id, comment_id) DO UPDATE SET
          channel_id = EXCLUDED.channel_id,
          video_id = EXCLUDED.video_id,
          author = EXCLUDED.author,
          text = EXCLUDED.text,
          like_count = EXCLUDED.like_count,
          published_at = EXCLUDED.published_at,
          category = EXCLUDED.category,
          confidence = EXCLUDED.confidence,
          classifier_method = EXCLUDED.classifier_method,
          updated_at = NOW()`,
        params
      );
    }

    cookieStore.set("canopy_youtube_oauth_state", "", { path: "/", maxAge: 0 });

    const byVideo = new Set(classified.map((row) => row.videoId).filter(Boolean));
    const redirect = new URL("/dashboard", url.origin);
    redirect.searchParams.set("connected", "1");
    redirect.searchParams.set("channel", channel.channelTitle);
    redirect.searchParams.set("fetched", String(classified.length));
    redirect.searchParams.set("videos", String(byVideo.size));

    return NextResponse.redirect(redirect);
  } catch (error) {
    console.error("youtube oauth callback failed", error);
    const url = new URL(req.url);
    return NextResponse.redirect(new URL("/?youtube_error=callback_failed", url.origin));
  }
}
