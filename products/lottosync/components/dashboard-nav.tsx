"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const items = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/daily", label: "Daily Entry" },
  { href: "/dashboard/scratch-offs", label: "Scratch-offs" },
  { href: "/dashboard/commissions", label: "Commissions" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-950 p-5 text-slate-200">
      <h2 className="mb-8 text-xl font-semibold">LottoTally</h2>
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-2 text-sm ${
              pathname === item.href ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-auto rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
      >
        Log out
      </button>
    </aside>
  );
}
