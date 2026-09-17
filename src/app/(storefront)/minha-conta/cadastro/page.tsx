"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { registerCustomerAction } from "@/app/(storefront)/minha-conta/actions";

export default function RegisterPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = Object.fromEntries(formData.entries()) as Record<string, string>;
    startTransition(async () => {
      const result = await registerCustomerAction(raw);
      if (!result.success) setMessage(result.message ?? "Erro ao cadastrar");
    });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-extrabold text-navy-900">Criar conta</h1>
      <p className="mt-1 text-sm text-tggray-600">Acompanhe seus pedidos e agilize suas compras</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-navy-800">Nome completo</label>
          <input name="name" required className="w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-navy-800">E-mail</label>
          <input name="email" type="email" required className="w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-navy-800">WhatsApp</label>
          <input name="phone" required placeholder="(14) 90000-0000" className="w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-navy-800">Senha</label>
          <input name="password" type="password" required minLength={8} className="w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm" />
        </div>
        {message && <p className="text-sm text-red-600">{message}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-full bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Criando conta..." : "CRIAR CONTA"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-tggray-600">
        Já tem conta?{" "}
        <Link href="/minha-conta/entrar" className="font-semibold text-blue-600">
          Entrar
        </Link>
      </p>
    </div>
  );
}
