import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildYouTubeAuthUrl } from "@/lib/youtube";

export async function GET() {
  const cookieStore = await cookies();

  let creatorId = cookieStore.get("canopy_creator_id")?.value;
  if (!creatorId) {
    creatorId = randomUUID();
    cookieStore.set("canopy_creator_id", creatorId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const state = randomUUID();
  cookieStore.set("canopy_youtube_oauth_state", state, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
  });

  const authUrl = buildYouTubeAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
