"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addItemToCart } from "@/lib/cart";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { getAvailableStock } from "@/lib/inventory";
import { lookupCep, type CepAddress } from "@/lib/cep";
import { calculateShipping } from "@/lib/shipping";

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function addToCartAction(variantId: string, quantity: number) {
  const ip = await clientIp();
  const { ok } = rateLimit(`cart:add:${ip}`, 30, 60_000);
  if (!ok) return { success: false, message: "Muitas requisições. Aguarde um instante." };

  const available = await getAvailableStock(variantId);
  if (available < quantity) {
    return { success: false, message: "Quantidade indisponível em estoque no momento." };
  }

  await addItemToCart(variantId, quantity);
  revalidatePath("/carrinho");
  return { success: true };
}

export async function buyNowAction(variantId: string, quantity: number) {
  const result = await addToCartAction(variantId, quantity);
  if (!result.success) return result;
  redirect("/checkout");
}

export interface ShippingEstimate {
  valid: boolean;
  address?: CepAddress;
  shippingLabel?: string;
  shippingCents?: number;
  etaDays?: number;
  pickupEnabled?: boolean;
}

export async function estimateShippingAction(cep: string): Promise<ShippingEstimate> {
  const address = await lookupCep(cep);
  if (!address) return { valid: false };

  const quote = await calculateShipping("DELIVERY", 0);
  return {
    valid: true,
    address,
    shippingLabel: quote.label,
    shippingCents: quote.shippingCents,
    etaDays: quote.etaDays,
  };
}
