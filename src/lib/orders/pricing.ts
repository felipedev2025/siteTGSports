// Funções puras de cálculo de totais — sem I/O, fáceis de testar.
// A autoridade sobre preço/estoque/frete é sempre o backend: o frontend
// nunca envia (nem é confiado) valores de total, desconto ou frete.

export interface PriceableItem {
  unitPriceCents: number;
  quantity: number;
}

export function calculateSubtotal(items: PriceableItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
}

export interface OrderTotals {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
}

export function calculateOrderTotals(params: {
  items: PriceableItem[];
  discountCents?: number;
  shippingCents?: number;
}): OrderTotals {
  const subtotalCents = calculateSubtotal(params.items);
  const discountCents = Math.min(params.discountCents ?? 0, subtotalCents);
  const shippingCents = Math.max(params.shippingCents ?? 0, 0);
  const totalCents = Math.max(subtotalCents - discountCents + shippingCents, 0);

  return { subtotalCents, discountCents, shippingCents, totalCents };
}
