import "server-only";
import type { CartWithItems } from "@/lib/cart";
import { applyPixDiscount } from "@/lib/money";
import { validateCoupon } from "@/lib/coupons";
import { calculateShipping, type DeliveryType } from "@/lib/shipping";
import { calculateOrderTotals } from "@/lib/orders/pricing";

export interface CheckoutLineItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
}

export async function buildCheckoutCalculation(
  cart: CartWithItems,
  paymentMethod: "PIX" | "CREDIT_CARD",
  deliveryType: DeliveryType,
  couponCode?: string
) {
  const lineItems: CheckoutLineItem[] = cart.items.map((item) => {
    const product = item.variant.product;
    const unitPriceCents =
      paymentMethod === "PIX" ? applyPixDiscount(product.priceCents, product.pixDiscountPercent) : product.priceCents;
    return {
      variantId: item.variantId,
      productId: product.id,
      productName: product.name,
      variantName: item.variant.size,
      sku: item.variant.sku,
      unitPriceCents,
      quantity: item.quantity,
    };
  });

  const subtotalCents = lineItems.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);

  let couponError: string | undefined;
  let discountCents = 0;
  let couponId: string | undefined;
  let couponCodeApplied: string | undefined;

  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotalCents);
    if (!result.ok || !result.coupon) {
      couponError = result.error;
    } else {
      discountCents = result.discountCents;
      couponId = result.coupon.id;
      couponCodeApplied = result.coupon.code;
    }
  }

  const shippingQuote = await calculateShipping(deliveryType, subtotalCents);
  const totals = calculateOrderTotals({ items: lineItems, discountCents, shippingCents: shippingQuote.shippingCents });

  return { lineItems, totals, couponError, couponId, couponCode: couponCodeApplied, shippingQuote };
}
