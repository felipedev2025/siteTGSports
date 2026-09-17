"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { loginCustomerAction } from "@/app/(storefront)/minha-conta/actions";

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
    startTransition(async () => {
      const result = await loginCustomerAction(raw);
      if (!result.success) setMessage(result.message ?? "Erro ao entrar");
    });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-extrabold text-navy-900">Entrar</h1>
      <p className="mt-1 text-sm text-tggray-600">Acesse sua conta TG Sports</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-navy-800">E-mail</label>
          <input name="email" type="email" required className="w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm" />
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

      <p className="mt-5 text-center text-sm text-tggray-600">
        Ainda não tem conta?{" "}
        <Link href="/minha-conta/cadastro" className="font-semibold text-blue-600">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
