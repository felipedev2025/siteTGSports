import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { reserveStockForOrder, releaseStockForOrder } from "@/lib/inventory";
import { orderNumber } from "@/lib/slug";
import type { CheckoutInput } from "@/lib/validation/checkout";
import { getOrCreateAsaasCustomer, createAsaasCheckout, type AsaasBillingType } from "@/lib/asaas/client";
import { getOrCreateCart, clearCart } from "@/lib/cart";
import { buildCheckoutCalculation } from "@/lib/orders/checkout-calc";
import { COUPON_ERROR_MESSAGES } from "@/lib/coupons";
import { notificationService } from "@/lib/notifications/notification-service";

const RESERVATION_TTL_MINUTES = 60;

export class EmptyCartError extends Error {}
export class CouponInvalidError extends Error {
  constructor(public reasonCode: string) {
    super(COUPON_ERROR_MESSAGES[reasonCode as keyof typeof COUPON_ERROR_MESSAGES] ?? "Cupom inválido");
  }
}

export async function createOrderFromCheckout(input: CheckoutInput, customerId: string | null) {
  const cart = await getOrCreateCart();
  if (cart.items.length === 0) throw new EmptyCartError("Carrinho vazio");

  const calc = await buildCheckoutCalculation(cart, input.paymentMethod, input.deliveryType, input.couponCode);
  if (input.couponCode && calc.couponError) {
    throw new CouponInvalidError(calc.couponError);
  }

  const number = orderNumber();
  const billingType: AsaasBillingType = input.paymentMethod;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber: number,
        customerId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerCpf: input.customerCpf,
        deliveryType: input.deliveryType,
        shippingCep: input.shippingCep,
        shippingStreet: input.shippingStreet,
        shippingNumber: input.shippingNumber,
        shippingComplement: input.shippingComplement,
        shippingDistrict: input.shippingDistrict,
        shippingCity: input.shippingCity,
        shippingState: input.shippingState,
        subtotalCents: calc.totals.subtotalCents,
        discountCents: calc.totals.discountCents,
        shippingCents: calc.totals.shippingCents,
        totalCents: calc.totals.totalCents,
        couponId: calc.couponId,
        couponCode: calc.couponCode,
        notes: input.notes,
        items: {
          create: calc.lineItems.map((i) => ({
            variantId: i.variantId,
            productId: i.productId,
            productName: i.productName,
            variantName: i.variantName,
            sku: i.sku,
            unitPriceCents: i.unitPriceCents,
            quantity: i.quantity,
            subtotalCents: i.unitPriceCents * i.quantity,
          })),
        },
        statusHistory: { create: { status: "AGUARDANDO_PAGAMENTO", note: "Pedido criado" } },
      },
    });

    await reserveStockForOrder(
      tx,
      created.id,
      calc.lineItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      RESERVATION_TTL_MINUTES
    );

    if (calc.couponId) {
      await tx.couponUsage.create({ data: { couponId: calc.couponId, orderId: created.id, customerId } });
      await tx.coupon.update({ where: { id: calc.couponId }, data: { usedCount: { increment: 1 } } });
    }

    return created;
  });

  await clearCart(cart.id);

  // Integração com Asaas acontece fora da transação de banco (chamada de rede).
  try {
    const asaasCustomer = await getOrCreateAsaasCustomer({
      name: input.customerName,
      cpfCnpj: input.customerCpf,
      email: input.customerEmail,
      mobilePhone: input.customerPhone,
      externalReference: customerId ?? undefined,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const checkout = await createAsaasCheckout({
      billingTypes: [billingType],
      externalReference: order.id,
      minutesToExpire: RESERVATION_TTL_MINUTES,
      customer: asaasCustomer.id,
      items: [{ name: `Pedido ${order.orderNumber} - TG Sports`, quantity: 1, value: calc.totals.totalCents / 100 }],
      callback: {
        successUrl: `${appUrl}/pedido/${order.id}/sucesso`,
        cancelUrl: `${appUrl}/pedido/${order.id}`,
        expiredUrl: `${appUrl}/pedido/${order.id}`,
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        asaasCustomerId: asaasCustomer.id,
        asaasCheckoutId: checkout.id,
        billingTypes: [billingType],
        amountCents: calc.totals.totalCents,
        checkoutUrl: checkout.link,
        rawCreateResponse: checkout as unknown as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + RESERVATION_TTL_MINUTES * 60_000),
      },
    });

    await notificationService
      .send({
        event: "ORDER_RECEIVED",
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
      })
      .catch((err) => console.error("[notification] falha ao notificar pedido recebido", err));

    return { order, checkoutUrl: checkout.link! };
  } catch (err) {
    // Se a integração falhar, cancela o pedido e libera o estoque reservado
    // para não deixar reservas "fantasmas" presas.
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELADO", paymentStatus: "FAILED" } });
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: "CANCELADO", note: "Falha ao iniciar cobrança no Asaas" },
      });
      await releaseStockForOrder(tx, order.id, "RELEASED");
    });
    throw err;
  }
}
