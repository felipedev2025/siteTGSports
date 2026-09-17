"use client";

import { useState, useTransition } from "react";
import { estimateShippingAction, type ShippingEstimate } from "@/app/(storefront)/produto/actions";
import { centsToBRL } from "@/lib/money";

export function ShippingEstimator() {
  const [cep, setCep] = useState("");
  const [result, setResult] = useState<ShippingEstimate | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await estimateShippingAction(cep);
      setResult(r);
    });
  }

  return (
    <div className="rounded-xl border border-tggray-200 p-4">
      <p className="mb-2 text-sm font-semibold text-navy-900">Consulte o frete e prazo</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          placeholder="Digite seu CEP"
          maxLength={9}
          className="flex-1 rounded-lg border border-tggray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "..." : "OK"}
        </button>
      </form>
      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-block text-xs text-blue-600 hover:underline"
      >
        Não sei meu CEP
      </a>

      {result && (
        <div className="mt-3 rounded-lg bg-tggray-50 p-3 text-sm">
          {result.valid ? (
            <>
              <p className="font-medium text-navy-900">
                {result.address?.city} / {result.address?.state}
              </p>
              <p className="mt-1 text-tggray-700">
                {result.shippingCents === 0 ? "Frete grátis" : `Frete: ${centsToBRL(result.shippingCents ?? 0)}`}
                {result.etaDays ? ` · até ${result.etaDays} dia(s) útil(eis) após a confirmação` : ""}
              </p>
              <p className="mt-1 text-xs text-tggray-500">Retirada na loja também disponível em Jaú/SP.</p>
            </>
          ) : (
            <p className="text-red-600">CEP não encontrado. Confira e tente novamente.</p>
          )}
        </div>
      )}
    </div>
  );
}
