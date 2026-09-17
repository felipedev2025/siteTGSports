import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOrCreateCart } from "@/lib/cart";
import { getStoreSettings } from "@/lib/shipping";
import { getCurrentCustomer } from "@/lib/auth/session";
import { CheckoutForm } from "@/components/storefront/CheckoutForm";

export const metadata: Metadata = { title: "Finalizar compra" };

export default async function CheckoutPage() {
  const cart = await getOrCreateCart();
  if (cart.items.length === 0) redirect("/carrinho");

  const [settings, customer] = await Promise.all([getStoreSettings(), getCurrentCustomer()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-navy-900">Finalizar compra</h1>
      <CheckoutForm
        pickupEnabled={settings.pickupEnabled}
        pickupInstructions={settings.pickupInstructions}
        defaultName={customer?.name}
        defaultEmail={customer?.email}
      />
    </div>
  );
}
