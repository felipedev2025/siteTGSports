"use client";

import { useState, useTransition } from "react";
import { createFirstAdminAction } from "@/app/admin/setup/actions";

export function AdminSetupForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
    startTransition(async () => {
      const result = await createFirstAdminAction(raw);
      if (!result.success) setMessage(result.message ?? "Erro ao criar administrador");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Nome completo</label>
        <input name="name" required autoFocus className="w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">E-mail</label>
        <input name="email" type="email" required className="w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Senha</label>
        <input name="password" type="password" required minLength={8} className="w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Confirmar senha</label>
        <input name="confirmPassword" type="password" required minLength={8} className="w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm" />
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Criando..." : "CRIAR ADMINISTRADOR E ENTRAR"}
      </button>
    </form>
  );
}
