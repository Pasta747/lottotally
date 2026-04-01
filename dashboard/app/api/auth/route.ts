import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PASSWORD = "PastaOS2026";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = formData.get("password");

  if (password === PASSWORD) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("pasta-dash-auth", PASSWORD, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return response;
  }

  return NextResponse.redirect(new URL("/?error=1", request.url));
}
