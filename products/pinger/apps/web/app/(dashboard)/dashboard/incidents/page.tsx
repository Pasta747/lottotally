import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureDefaultWorkspace } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";

export default async function IncidentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) return null;

  const { projectId } = await ensureDefaultWorkspace(session.user.id, session.user.email);

  const incidents = await prisma.incident.findMany({
    where: { monitor: { projectId } },
    orderBy: { startedAt: "desc" },
    include: { monitor: { select: { name: true } } },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <header className="rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">Incidents</h1>
        <p className="mt-1 text-zinc-600">Recent monitor incidents and their current status.</p>
      </header>

      <section className="rounded-xl border bg-white p-6">
        <div className="space-y-3">
          {incidents.length === 0 && <p className="text-sm text-zinc-500">No incidents yet.</p>}
          {incidents.map((incident: (typeof incidents)[number]) => (
            <div key={incident.id} className="rounded-lg border p-3">
              <p className="font-medium">{incident.title}</p>
              <p className="text-sm text-zinc-600">
                {incident.monitor.name} · {incident.status}
              </p>
              <p className="text-xs text-zinc-500">Started: {new Date(incident.startedAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
