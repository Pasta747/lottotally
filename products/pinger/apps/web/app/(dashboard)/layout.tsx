import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

const nav = [
  { label: "Overview", href: "/dashboard" },
  { label: "Incidents", href: "/dashboard/incidents" },
  { label: "Notifications", href: "/dashboard/notifications" },
  { label: "Billing", href: "/dashboard/billing" },
  { label: "Settings", href: "/dashboard/settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-xl border bg-white p-4">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <Image src="/brand/pinger-logo-32.png" alt="Pinger logo" width={28} height={28} />
                <p className="text-sm font-semibold">Pinger</p>
              </div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Agency Dashboard</p>
            </div>
            <nav className="space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-zinc-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
