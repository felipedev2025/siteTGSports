import "server-only";
import { prisma } from "@/lib/db";
import type { Coupon } from "@prisma/client";

export type CouponValidationError =
  | "NOT_FOUND"
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "MAX_USES_REACHED"
  | "MIN_PURCHASE_NOT_MET";

export interface CouponValidationResult {
  ok: boolean;
  error?: CouponValidationError;
  coupon?: Coupon;
  discountCents: number;
}

/** Função pura — calcula o desconto de um cupom já validado sobre um subtotal. Fácil de testar. */
export function calculateCouponDiscount(coupon: Pick<Coupon, "type" | "value">, subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  if (coupon.type === "PERCENT") {
    const raw = Math.round((subtotalCents * coupon.value) / 100);
    return Math.min(raw, subtotalCents);
  }
  // FIXED: value já está em centavos
  return Math.min(coupon.value, subtotalCents);
}

export async function validateCoupon(code: string, subtotalCents: number): Promise<CouponValidationResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon) return { ok: false, error: "NOT_FOUND", discountCents: 0 };
  if (!coupon.active) return { ok: false, error: "INACTIVE", discountCents: 0 };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, error: "NOT_STARTED", discountCents: 0 };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, error: "EXPIRED", discountCents: 0 };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "MAX_USES_REACHED", discountCents: 0 };
  }
  if (coupon.minPurchaseCents && subtotalCents < coupon.minPurchaseCents) {
    return { ok: false, error: "MIN_PURCHASE_NOT_MET", discountCents: 0 };
  }

  return { ok: true, coupon, discountCents: calculateCouponDiscount(coupon, subtotalCents) };
}

export const COUPON_ERROR_MESSAGES: Record<CouponValidationError, string> = {
  NOT_FOUND: "Cupom não encontrado.",
  INACTIVE: "Cupom inativo.",
  NOT_STARTED: "Este cupom ainda não é válido.",
  EXPIRED: "Este cupom expirou.",
  MAX_USES_REACHED: "Este cupom atingiu o limite de usos.",
  MIN_PURCHASE_NOT_MET: "O valor mínimo de compra para este cupom não foi atingido.",
};
