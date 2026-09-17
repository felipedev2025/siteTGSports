// Todos os valores monetários trafegam e são armazenados como centavos (Int).
// Nunca usar float para dinheiro.

export function centsToBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function reaisToCents(value: number): number {
  return Math.round(value * 100);
}

export function applyPixDiscount(priceCents: number, pixDiscountPercent: number): number {
  if (!pixDiscountPercent) return priceCents;
  const discount = Math.round((priceCents * pixDiscountPercent) / 100);
  return priceCents - discount;
}

export function discountPercentBetween(from: number, to: number): number {
  if (!from || from <= to) return 0;
  return Math.round(((from - to) / from) * 100);
}

export function installmentOf(priceCents: number, installments: number): { count: number; valueCents: number } {
  const count = Math.max(1, installments);
  return { count, valueCents: Math.ceil(priceCents / count) };
}
