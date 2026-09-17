"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { NAV_LINKS } from "./nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-navy-900"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setOpen(false)} />
          <div className="relative ml-auto flex h-full w-[85%] max-w-sm flex-col gap-6 bg-white p-6 shadow-xl animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-navy-900">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="h-9 w-9 text-navy-900">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <SearchBar />
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-navy-800 hover:bg-tggray-50"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 border-t border-tggray-100 pt-4">
              <Link href="/minha-conta" onClick={() => setOpen(false)} className="text-sm font-medium text-navy-800">
                Minha conta
              </Link>
              <Link href="/favoritos" onClick={() => setOpen(false)} className="text-sm font-medium text-navy-800">
                Favoritos
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
