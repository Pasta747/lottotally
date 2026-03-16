import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { ensureDefaultWorkspace } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agencyId } = await ensureDefaultWorkspace(session.user.id, session.user.email);
  const statusPage = await prisma.statusPage.findFirst({
    where: { agencyId },
    select: { id: true, name: true, slug: true, logoUrl: true, brandColor: true, isPublic: true },
  });

  return NextResponse.json({ statusPage });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agencyId } = await ensureDefaultWorkspace(session.user.id, session.user.email);
  const body = await req.json();

  const name = String(body?.name ?? "").trim();
  const logoUrlRaw = String(body?.logoUrl ?? "").trim();
  const brandColor = String(body?.brandColor ?? "").trim();

  if (!name) return NextResponse.json({ error: "Status page name is required" }, { status: 400 });
  if (!HEX_COLOR.test(brandColor)) {
    return NextResponse.json({ error: "Brand color must be a 6-digit hex value (e.g. #16a34a)" }, { status: 400 });
  }

  const logoUrl = logoUrlRaw ? logoUrlRaw : null;

  const existing = await prisma.statusPage.findFirst({ where: { agencyId }, select: { id: true, slug: true } });

  const statusPage = existing
    ? await prisma.statusPage.update({
        where: { id: existing.id },
        data: { name, logoUrl, brandColor },
      })
    : await prisma.statusPage.create({
        data: {
          agencyId,
          name,
          slug: `${agencyId.slice(0, 8)}-status`,
          logoUrl,
          brandColor,
          isPublic: true,
        },
      });

  return NextResponse.json({ statusPage });
}
