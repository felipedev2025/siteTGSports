"use client";

import { useState, type ReactNode } from "react";

export function Accordion({ items }: { items: { id: string; title: string; content: ReactNode }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-tggray-200 border-y border-tggray-200">
      {items.map((item) => (
        <div key={item.id} id={item.id}>
          <button
            type="button"
            onClick={() => setOpen(open === item.id ? null : item.id)}
            className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-navy-900"
          >
            {item.title}
            <span className={`transition-transform ${open === item.id ? "rotate-45" : ""}`}>+</span>
          </button>
          {open === item.id && (
            <div className="animate-fade-in pb-4 text-sm leading-relaxed text-tggray-700">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
