import { describe, it, expect } from "vitest";
import { calculateSubtotal, calculateOrderTotals } from "@/lib/orders/pricing";
import { calculateCouponDiscount } from "@/lib/coupons";
import { applyPixDiscount, discountPercentBetween, installmentOf } from "@/lib/money";

describe("carrinho — cálculo de subtotal", () => {
  it("soma preço unitário x quantidade de múltiplos itens", () => {
    const items = [
      { unitPriceCents: 10000, quantity: 2 },
      { unitPriceCents: 5000, quantity: 1 },
    ];
    expect(calculateSubtotal(items)).toBe(25000);
  });

  it("retorna 0 para carrinho vazio", () => {
    expect(calculateSubtotal([])).toBe(0);
  });
});

describe("pedido — cálculo de totais (subtotal, desconto, frete)", () => {
  it("calcula total = subtotal - desconto + frete", () => {
    const totals = calculateOrderTotals({
      items: [{ unitPriceCents: 10000, quantity: 1 }],
      discountCents: 1000,
      shippingCents: 2000,
    });
    expect(totals).toEqual({
      subtotalCents: 10000,
      discountCents: 1000,
      shippingCents: 2000,
      totalCents: 11000,
    });
  });

  it("nunca deixa o desconto ultrapassar o subtotal", () => {
    const totals = calculateOrderTotals({
      items: [{ unitPriceCents: 10000, quantity: 1 }],
      discountCents: 999999,
    });
    expect(totals.discountCents).toBe(10000);
    expect(totals.totalCents).toBe(0);
  });

  it("nunca deixa o total ficar negativo mesmo com frete", () => {
    const totals = calculateOrderTotals({
      items: [{ unitPriceCents: 1000, quantity: 1 }],
      discountCents: 1000,
      shippingCents: 0,
    });
    expect(totals.totalCents).toBe(0);
  });
});

describe("cupom — cálculo de desconto", () => {
  it("desconto percentual", () => {
    expect(calculateCouponDiscount({ type: "PERCENT", value: 10 }, 100000)).toBe(10000);
  });

  it("desconto fixo (em centavos)", () => {
    expect(calculateCouponDiscount({ type: "FIXED", value: 5000 }, 100000)).toBe(5000);
  });

  it("desconto fixo não pode ultrapassar o subtotal", () => {
    expect(calculateCouponDiscount({ type: "FIXED", value: 50000 }, 10000)).toBe(10000);
  });

  it("desconto percentual de 100% zera o subtotal", () => {
    expect(calculateCouponDiscount({ type: "PERCENT", value: 100 }, 12345)).toBe(12345);
  });
});

describe("preço PIX e parcelamento", () => {
  it("aplica desconto PIX corretamente", () => {
    expect(applyPixDiscount(10000, 10)).toBe(9000);
  });

  it("sem desconto PIX retorna o mesmo preço", () => {
    expect(applyPixDiscount(10000, 0)).toBe(10000);
  });

  it("calcula percentual de desconto entre preço De/Por", () => {
    expect(discountPercentBetween(20000, 15000)).toBe(25);
  });

  it("parcela igualmente e arredonda para cima", () => {
    const { count, valueCents } = installmentOf(10000, 3);
    expect(count).toBe(3);
    expect(valueCents).toBe(3334);
  });
});
