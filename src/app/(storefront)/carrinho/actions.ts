"use server";

import { revalidatePath } from "next/cache";
import { updateCartItemQuantity, removeCartItem } from "@/lib/cart";
import { getAvailableStock } from "@/lib/inventory";

export async function updateQuantityAction(itemId: string, variantId: string, quantity: number) {
  if (quantity > 0) {
    const available = await getAvailableStock(variantId);
    if (quantity > available) {
      return { success: false, message: `Apenas ${available} unidade(s) disponível(is).` };
    }
  }
  await updateCartItemQuantity(itemId, quantity);
  revalidatePath("/carrinho");
  return { success: true };
}

export async function removeItemAction(itemId: string) {
  await removeCartItem(itemId);
  revalidatePath("/carrinho");
}
