"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { centsToBRL, applyPixDiscount } from "@/lib/money";
import { updateQuantityAction, removeItemAction } from "@/app/(storefront)/carrinho/actions";

interface CartItemRowProps {
  itemId: string;
  variantId: string;
  size: string;
  quantity: number;
  productName: string;
  productSlug: string;
  imageUrl?: string;
  priceCents: number;
  pixDiscountPercent: number;
}

export function CartItemRow(props: CartItemRowProps) {
  const [quantity, setQuantity] = useState(props.quantity);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeQuantity(next: number) {
    if (next < 0) return;
    setQuantity(next);
    setError(null);
    startTransition(async () => {
      const result = await updateQuantityAction(props.itemId, props.variantId, next);
      if (!result.success) {
        setError(result.message ?? "Erro ao atualizar quantidade");
        setQuantity(props.quantity);
      }
    });
  }

  const pixPrice = applyPixDiscount(props.priceCents, props.pixDiscountPercent);

  return (
    <div className="flex gap-4 border-b border-tggray-100 py-5">
      <Link href={`/produto/${props.productSlug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-tggray-50">
        {props.imageUrl && (
          <Image src={props.imageUrl} alt={props.productName} fill sizes="96px" className="object-cover" />
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/produto/${props.productSlug}`} className="text-sm font-semibold text-navy-900 hover:text-blue-600">
              {props.productName}
            </Link>
            <p className="mt-0.5 text-xs text-tggray-500">Tamanho: {props.size}</p>
          </div>
          <button
            onClick={() => startTransition(() => removeItemAction(props.itemId))}
            className="text-xs font-medium text-tggray-400 hover:text-red-600"
          >
            Remover
          </button>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex items-center rounded-lg border border-tggray-200">
            <button
              disabled={isPending}
              onClick={() => changeQuantity(quantity - 1)}
              className="flex h-8 w-8 items-center justify-center text-navy-800"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
            <button
              disabled={isPending}
              onClick={() => changeQuantity(quantity + 1)}
              className="flex h-8 w-8 items-center justify-center text-navy-800"
            >
              +
            </button>
          </div>

          <div className="text-right">
            <p className="text-sm font-bold text-navy-900">{centsToBRL(props.priceCents * quantity)}</p>
            {props.pixDiscountPercent > 0 && (
              <p className="text-xs text-green-600">{centsToBRL(pixPrice * quantity)} no PIX</p>
            )}
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
