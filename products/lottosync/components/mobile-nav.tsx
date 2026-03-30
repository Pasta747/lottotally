"use client";

import { useState } from "react";
import Link from "next/link";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold">L</span>
          <span className="font-semibold tracking-tight">LottoTally</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
          <Link href="/login" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:text-white">Log in</Link>
          <Link href="/signup" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">Start trial</Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:text-white">Log in</Link>
          <Link href="/signup" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">Start trial</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            <a href="#features" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={() => setOpen(false)}>Features</a>
            <a href="#pricing" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={() => setOpen(false)}>Pricing</a>
            <a href="#faq" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={() => setOpen(false)}>FAQ</a>
            <Link href="/login" className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={() => setOpen(false)}>Log in</Link>
            <Link href="/signup" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500" onClick={() => setOpen(false)}>Start trial</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
