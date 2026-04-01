import { NextResponse } from "next/server";

const PASSWORD = "PastaOS2026";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = formData.get("password");

  if (password === PASSWORD) {
    const response = NextResponse.redirect(new URL("/", request.url), { status: 302 });
    response.cookies.set("pasta-dash-auth", PASSWORD, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    return response;
  }

  return NextResponse.redirect(new URL("/?error=1", request.url), { status: 302 });
}
