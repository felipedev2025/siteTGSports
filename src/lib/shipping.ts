import "server-only";
import { prisma } from "@/lib/db";

export type DeliveryType = "DELIVERY" | "PICKUP";

export interface ShippingQuote {
  deliveryType: DeliveryType;
  shippingCents: number;
  label: string;
  etaDays: number;
}

/**
 * Módulo de frete desacoplado. Hoje resolve a partir das configurações da
 * loja (retirada / frete fixo / frete grátis acima de X). Para integrar um
 * gateway (Correios, Melhor Envio, etc.) no futuro, basta trocar o corpo de
 * `calculateShipping` por uma chamada ao gateway, mantendo a mesma assinatura.
 */
export async function calculateShipping(deliveryType: DeliveryType, subtotalCents: number): Promise<ShippingQuote> {
  const settings = await getStoreSettings();

  if (deliveryType === "PICKUP") {
    return { deliveryType, shippingCents: 0, label: "Retirada na loja", etaDays: 0 };
  }

  const free = settings.freeShippingAboveCents !== null && subtotalCents >= settings.freeShippingAboveCents;
  const shippingCents = free ? 0 : settings.fixedShippingCents;

  return {
    deliveryType,
    shippingCents,
    label: free ? "Frete grátis" : "Frete fixo",
    etaDays: settings.extraDeliveryDays,
  };
}

export async function getStoreSettings() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (settings) return settings;
  return prisma.settings.create({ data: { id: 1 } });
}
