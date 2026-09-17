"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { loginAdminAction } from "@/app/admin/login/actions";

export function AdminLoginForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
    startTransition(async () => {
      const result = await loginAdminAction(raw, next);
      if (!result.success) setMessage(result.message ?? "Erro ao entrar");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">E-mail</label>
        <input name="email" type="email" required autoFocus className="w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Senha</label>
        <input name="password" type="password" required className="w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm" />
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Entrando..." : "ENTRAR"}
      </button>
    </form>
  );
}
