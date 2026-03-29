import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
    }

    // 1. Find the user by the reset token and check expiry
    const userResult = await sql`SELECT id, email FROM lt_users WHERE reset_token = ${token} AND reset_token_expires > NOW()`;

    if (userResult.length === 0) {
      // Token is invalid or expired
      return NextResponse.json({ error: "Invalid or expired password reset token." }, { status: 400 });
    }

    const user = userResult[0];

    // 2. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Update the user's password and clear the reset token
    await sql`
      UPDATE lt_users
      SET
        password_hash = ${hashedPassword},
        reset_token = NULL,
        reset_token_expires = NULL
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ message: "Password reset successful." });
  } catch (error: unknown) {
    console.error("Password reset API error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: `Password reset failed: ${errorMessage}` }, { status: 500 });
  }
}
