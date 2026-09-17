"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction, buyNowAction } from "@/app/(storefront)/produto/actions";

interface VariantOption {
  id: string;
  size: string;
  available: number;
}

export function ProductActions({ variants }: { variants: VariantOption[] }) {
  const [selected, setSelected] = useState<VariantOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const sortedVariants = [...variants].sort((a, b) => Number(a.size) - Number(b.size));

  function handleSelect(v: VariantOption) {
    if (v.available <= 0) return;
    setSelected(v);
    setQuantity(1);
    setMessage(null);
  }

  function handleAddToCart() {
    if (!selected) {
      setMessage({ type: "error", text: "Selecione uma numeração." });
      return;
    }
    startTransition(async () => {
      const result = await addToCartAction(selected.id, quantity);
      if (!result.success) {
        setMessage({ type: "error", text: result.message ?? "Não foi possível adicionar ao carrinho." });
      } else {
        setMessage({ type: "success", text: "Produto adicionado ao carrinho!" });
        router.refresh();
      }
    });
  }

  function handleBuyNow() {
    if (!selected) {
      setMessage({ type: "error", text: "Selecione uma numeração." });
      return;
    }
    startTransition(async () => {
      await buyNowAction(selected.id, quantity);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-navy-900">Numeração</span>
          <a href="#tabela-medidas" className="text-xs font-medium text-blue-600 hover:underline">
            Tabela de medidas
          </a>
        </div>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {sortedVariants.map((v) => {
            const disabled = v.available <= 0;
            const isSelected = selected?.id === v.id;
            return (
              <button
                key={v.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(v)}
                className={`flex h-11 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                  disabled
                    ? "cursor-not-allowed border-tggray-100 text-tggray-400 line-through"
                    : isSelected
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-tggray-200 text-navy-800 hover:border-navy-400"
                }`}
              >
                {v.size}
              </button>
            );
          })}
        </div>
        {selected && selected.available <= 3 && (
          <p className="mt-2 text-xs font-semibold text-red-600">Últimas {selected.available} unidades!</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-navy-900">Quantidade</span>
        <div className="flex items-center rounded-lg border border-tggray-200">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center text-navy-800"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(selected?.available ?? 10, q + 1))}
            className="flex h-10 w-10 items-center justify-center text-navy-800"
          >
            +
          </button>
        </div>
      </div>

      {message && (
        <p className={`text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
          {message.text}
        </p>
      )}

      <div className="hidden gap-3 sm:flex">
        <button
          type="button"
          disabled={isPending}
          onClick={handleAddToCart}
          className="flex-1 rounded-full border-2 border-navy-900 py-3.5 text-sm font-bold text-navy-900 transition hover:bg-navy-900 hover:text-white disabled:opacity-60"
        >
          ADICIONAR AO CARRINHO
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleBuyNow}
          className="flex-1 rounded-full bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-60"
        >
          COMPRAR AGORA
        </button>
      </div>

      {/* Barra fixa no mobile — CTA de compra sempre acessível */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-tggray-200 bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:hidden">
        <button
          type="button"
          disabled={isPending}
          onClick={handleAddToCart}
          className="flex-1 rounded-full border-2 border-navy-900 py-3 text-xs font-bold text-navy-900 disabled:opacity-60"
        >
          ADICIONAR
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleBuyNow}
          className="flex-1 rounded-full bg-blue-600 py-3 text-xs font-bold text-white disabled:opacity-60"
        >
          COMPRAR AGORA
        </button>
      </div>
    </div>
  );
}
