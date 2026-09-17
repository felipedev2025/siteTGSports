import type { Metadata } from "next";
import Link from "next/link";
import { getOrCreateCart } from "@/lib/cart";
import { calculateSubtotal } from "@/lib/orders/pricing";
import { centsToBRL } from "@/lib/money";
import { CartItemRow } from "@/components/storefront/CartItemRow";

export const metadata: Metadata = { title: "Carrinho de compras" };

export default async function CartPage() {
  const cart = await getOrCreateCart();

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#96a0b5" strokeWidth="1.5" className="mb-4">
          <path d="M6 6h15l-1.5 9h-12L6 6Z" strokeLinejoin="round" />
          <path d="M6 6 5 2H2" strokeLinecap="round" />
          <circle cx="9.5" cy="20" r="1.4" />
          <circle cx="17.5" cy="20" r="1.4" />
        </svg>
        <h1 className="text-xl font-bold text-navy-900">Seu carrinho está vazio</h1>
        <p className="mt-1 text-sm text-tggray-600">Explore nosso catálogo e encontre o tênis perfeito para você.</p>
        <Link href="/produtos" className="mt-6 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white">
          Continuar comprando
        </Link>
      </div>
    );
  }

  const lineItems = cart.items.map((item) => ({
    unitPriceCents: item.variant.product.priceCents,
    quantity: item.quantity,
  }));
  const subtotalCents = calculateSubtotal(lineItems);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-navy-900">Meu carrinho</h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          {cart.items.map((item) => (
            <CartItemRow
              key={item.id}
              itemId={item.id}
              variantId={item.variantId}
              size={item.variant.size}
              quantity={item.quantity}
              productName={item.variant.product.name}
              productSlug={item.variant.product.slug}
              imageUrl={item.variant.product.images[0]?.url}
              priceCents={item.variant.product.priceCents}
              pixDiscountPercent={item.variant.product.pixDiscountPercent}
            />
          ))}
          <Link href="/produtos" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline">
            ← Continuar comprando
          </Link>
        </div>

        <div className="w-full shrink-0 lg:w-80">
          <div className="sticky top-24 rounded-2xl border border-tggray-200 p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-navy-900">Resumo</h2>
            <div className="flex justify-between text-sm text-tggray-700">
              <span>Subtotal</span>
              <span className="font-semibold text-navy-900">{centsToBRL(subtotalCents)}</span>
            </div>
            <p className="mt-1 text-xs text-tggray-500">Frete e cupom calculados no checkout</p>
            <Link
              href="/checkout"
              className="mt-5 block rounded-full bg-blue-600 py-3.5 text-center text-sm font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500"
            >
              FINALIZAR COMPRA
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
