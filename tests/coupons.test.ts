import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { validateCoupon } from "@/lib/coupons";
import { resetDb } from "./helpers/db";

describe("validação de cupom (contra o banco)", () => {
  beforeEach(resetDb);
  afterAll(async () => prisma.$disconnect());

  it("cupom inexistente é rejeitado", async () => {
    const result = await validateCoupon("NAOEXISTE", 10000);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("NOT_FOUND");
  });

  it("cupom inativo é rejeitado", async () => {
    await prisma.coupon.create({ data: { code: "INATIVO", type: "PERCENT", value: 10, active: false } });
    const result = await validateCoupon("INATIVO", 10000);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("INACTIVE");
  });

  it("cupom expirado é rejeitado", async () => {
    await prisma.coupon.create({
      data: { code: "EXPIRADO", type: "PERCENT", value: 10, active: true, expiresAt: new Date(Date.now() - 86_400_000) },
    });
    const result = await validateCoupon("EXPIRADO", 10000);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("EXPIRED");
  });

  it("cupom com valor mínimo de compra não atingido é rejeitado", async () => {
    await prisma.coupon.create({
      data: { code: "MIN100", type: "PERCENT", value: 10, active: true, minPurchaseCents: 10000 },
    });
    const result = await validateCoupon("MIN100", 5000);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("MIN_PURCHASE_NOT_MET");
  });

  it("cupom que atingiu o limite de usos é rejeitado", async () => {
    await prisma.coupon.create({
      data: { code: "LIMITADO", type: "PERCENT", value: 10, active: true, maxUses: 1, usedCount: 1 },
    });
    const result = await validateCoupon("LIMITADO", 10000);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("MAX_USES_REACHED");
  });

  it("cupom válido retorna o desconto calculado", async () => {
    await prisma.coupon.create({ data: { code: "VALIDO10", type: "PERCENT", value: 10, active: true } });
    const result = await validateCoupon("valido10", 10000);
    expect(result.ok).toBe(true);
    expect(result.discountCents).toBe(1000);
  });
});
