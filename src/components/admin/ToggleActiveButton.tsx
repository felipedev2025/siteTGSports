"use client";

import { useTransition } from "react";

export function ToggleActiveButton({ active, action }: { active: boolean; action: () => Promise<void> }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(action)}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-green-50 text-green-600" : "bg-tggray-100 text-tggray-500"}`}
    >
      {active ? "Ativo" : "Inativo"}
    </button>
  );
}
