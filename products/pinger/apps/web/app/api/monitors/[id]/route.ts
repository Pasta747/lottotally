import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultWorkspace } from "@/lib/bootstrap";

function asInterval(value: string) {
  return ["ONE_MINUTE", "FIVE_MINUTES", "FIFTEEN_MINUTES"].includes(value)
    ? (value as "ONE_MINUTE" | "FIVE_MINUTES" | "FIFTEEN_MINUTES")
    : undefined;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { projectId } = await ensureDefaultWorkspace(session.user.id, session.user.email);

  const existing = await prisma.monitor.findFirst({ where: { id, projectId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const data: {
    name?: string;
    url?: string;
    interval?: "ONE_MINUTE" | "FIVE_MINUTES" | "FIFTEEN_MINUTES";
    timeoutMs?: number;
    expectedStatusCode?: number;
  } = {};

  if (typeof body?.name === "string") data.name = body.name.trim();
  if (typeof body?.url === "string") data.url = body.url.trim();
  if (typeof body?.interval === "string") data.interval = asInterval(body.interval);
  if (typeof body?.timeoutMs === "number") data.timeoutMs = body.timeoutMs;
  if (typeof body?.expectedStatusCode === "number") data.expectedStatusCode = body.expectedStatusCode;

  const monitor = await prisma.monitor.update({
    where: { id },
    data,
  });

  return NextResponse.json({ monitor });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { projectId } = await ensureDefaultWorkspace(session.user.id, session.user.email);

  const existing = await prisma.monitor.findFirst({ where: { id, projectId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.monitor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
