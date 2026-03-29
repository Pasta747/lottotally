import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  storeName: z.string().min(1),
  state: z.string().min(2),
});

export async function POST(req: Request) {
  try {
    console.log("Signup attempt. POSTGRES_URL:", process.env.POSTGRES_URL ? "SET" : "MISSING");
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Signup validation failed:", parsed.error);
      return NextResponse.json({ error: "Invalid signup data" }, { status: 400 });
    }

    const { email, password, storeName, state } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check if email already exists
    const existingUser = await sql`SELECT id FROM lt_users WHERE email = ${normalizedEmail}`;
    if (existingUser.length > 0) {
      console.error("Signup error: Email already in use");
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert new user into the database
    await sql`
      INSERT INTO lt_users (email, password_hash, store_name, state, commission_rate)
      VALUES (${normalizedEmail}, ${hash}, ${storeName}, ${state}, 5.5)
    `;
    console.log("Signup successful for:", normalizedEmail);
    return NextResponse.json({ success: true, trialDays: 14 });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ 
      error: "Failed to create account",
      detail: error?.message || String(error),
      stack: error?.stack?.split('\n').slice(0, 3) 
    }, { status: 500 });
  }
}
