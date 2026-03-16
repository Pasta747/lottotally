import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { trackFunnelEvent } from "../../../../lib/analytics";

const registerSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().max(255).transform((e) => e.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

/** In-memory registration rate limiter per IP */
const registerAttempts = new Map<string, { count: number; windowStart: number }>();
const MAX_REGISTRATIONS = 3;
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRegisterRate(ip: string): boolean {
  const now = Date.now();
  const record = registerAttempts.get(ip);
  if (!record || now - record.windowStart > REGISTER_WINDOW_MS) {
    registerAttempts.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (record.count >= MAX_REGISTRATIONS) return false;
  record.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRegisterRate(ip)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      // Don't reveal whether email exists — use generic message
      return NextResponse.json(
        { error: "Unable to create account with this email." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12); // bumped from 10 to 12 rounds

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
      },
    });

    await trackFunnelEvent({
      event: "signup_completed",
      userId: user.id,
      source: "register_api",
      metadata: { emailDomain: email.split("@")[1] ?? "unknown" },
    }).catch(() => undefined);

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 }
    );
  }
}
