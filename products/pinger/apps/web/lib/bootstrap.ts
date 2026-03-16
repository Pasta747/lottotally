import { prisma } from "@/lib/prisma";

export async function ensureDefaultWorkspace(userId: string, email?: string | null) {
  const existingMembership = await prisma.membership.findFirst({
    where: { userId },
    include: {
      agency: {
        include: {
          projects: { take: 1, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (existingMembership?.agency?.projects?.[0]) {
    const existingStatus = await prisma.statusPage.findFirst({
      where: { agencyId: existingMembership.agency.id },
      select: { slug: true },
    });

    if (!existingStatus) {
      await prisma.statusPage.create({
        data: {
          agencyId: existingMembership.agency.id,
          name: `${existingMembership.agency.name} Status`,
          slug: existingMembership.agency.slug,
          brandColor: "#16a34a",
          isPublic: true,
        },
      });
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: { agencyId: existingMembership.agency.id },
      select: { id: true },
    });

    if (!existingSubscription) {
      await prisma.subscription.create({
        data: {
          agencyId: existingMembership.agency.id,
          plan: "FREE",
          status: "active",
        },
      });
    }

    return {
      agencyId: existingMembership.agency.id,
      projectId: existingMembership.agency.projects[0].id,
    };
  }

  const slugBase = (email?.split("@")[0] || "agency").replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
  const slug = `${slugBase}-${userId.slice(0, 6)}`;

  const agency = await prisma.agency.create({
    data: {
      name: `${email ?? "My"} Agency`,
      slug,
      memberships: {
        create: {
          userId,
          role: "OWNER",
        },
      },
      projects: {
        create: {
          name: "Default Project",
        },
      },
      statusPages: {
        create: {
          name: "Client Status",
          slug,
          brandColor: "#16a34a",
          isPublic: true,
        },
      },
      subscriptions: {
        create: {
          plan: "FREE",
          status: "active",
        },
      },
    },
    include: { projects: { take: 1 } },
  });

  return { agencyId: agency.id, projectId: agency.projects[0].id };
}
