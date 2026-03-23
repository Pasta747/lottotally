import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  storeName: z.string().min(1),
  state: z.string().min(2),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid signup data" }, { status: 400 });
    }

    const { email, password, storeName, state } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    db.prepare(
      `INSERT INTO users (email, password_hash, store_name, state, commission_rate)
       VALUES (?, ?, ?, ?, 5.5)`
    ).run(normalizedEmail, hash, storeName, state);

    return NextResponse.json({ success: true, trialDays: 14 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
