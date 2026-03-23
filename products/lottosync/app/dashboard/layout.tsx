import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex min-h-screen bg-slate-100">
      <DashboardNav />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
