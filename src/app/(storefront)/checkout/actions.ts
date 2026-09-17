"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createOrderFromCheckout, EmptyCartError, CouponInvalidError } from "@/lib/orders/order-service";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getOrCreateCart } from "@/lib/cart";
import { buildCheckoutCalculation } from "@/lib/orders/checkout-calc";
import { lookupCep } from "@/lib/cep";
import { OutOfStockError } from "@/lib/inventory";
import { AsaasError } from "@/lib/asaas/client";
import { rateLimit } from "@/lib/rate-limit";

export async function lookupCepAction(cep: string) {
  return lookupCep(cep);
}

export async function previewTotalsAction(params: {
  paymentMethod: "PIX" | "CREDIT_CARD";
  deliveryType: "DELIVERY" | "PICKUP";
  couponCode?: string;
}) {
  const cart = await getOrCreateCart();
  if (cart.items.length === 0) {
    return { empty: true as const };
  }
  const calc = await buildCheckoutCalculation(cart, params.paymentMethod, params.deliveryType, params.couponCode);
  return {
    empty: false as const,
    totals: calc.totals,
    couponError: calc.couponError,
    couponApplied: calc.couponCode,
    shippingLabel: calc.shippingQuote.label,
    items: calc.lineItems,
  };
}

export interface CheckoutFormState {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitCheckoutAction(raw: Record<string, string>): Promise<CheckoutFormState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok } = rateLimit(`checkout:${ip}`, 8, 60_000);
  if (!ok) return { success: false, message: "Muitas tentativas. Aguarde um instante e tente novamente." };

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { success: false, message: "Verifique os campos destacados.", fieldErrors };
  }

  const customer = await getCurrentCustomer();

  let checkoutUrl: string;
  try {
    const result = await createOrderFromCheckout(parsed.data, customer?.id ?? null);
    checkoutUrl = result.checkoutUrl;
  } catch (err) {
    if (err instanceof EmptyCartError) return { success: false, message: "Seu carrinho está vazio." };
    if (err instanceof CouponInvalidError) return { success: false, message: err.message };
    if (err instanceof OutOfStockError) {
      return { success: false, message: "Um dos produtos do carrinho ficou sem estoque disponível. Revise seu carrinho." };
    }
    if (err instanceof AsaasError) {
      return { success: false, message: `Não foi possível iniciar o pagamento (${err.message}). Tente novamente.` };
    }
    console.error("[checkout] erro inesperado", err);
    return { success: false, message: "Erro inesperado ao processar seu pedido. Tente novamente." };
  }

  redirect(checkoutUrl);
}
