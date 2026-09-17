import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import { reserveStockForOrder } from "@/lib/inventory";
import { processAsaasWebhook } from "@/lib/orders/webhook-handler";
import { resetDb, createTestProduct } from "./helpers/db";

async function makeOrderWithPayment(variantId: string, quantity: number) {
  const order = await prisma.order.create({
    data: {
      orderNumber: `TEST-${Math.random().toString(36).slice(2, 8)}`,
      customerName: "Cliente Teste",
      customerEmail: "teste@example.com",
      customerPhone: "14999999999",
      customerCpf: "39053344705",
      deliveryType: "PICKUP",
      subtotalCents: 10000,
      totalCents: 10000,
    },
  });

  await prisma.$transaction((tx) => reserveStockForOrder(tx, order.id, [{ variantId, quantity }], 60));

  const checkoutId = `checkout_${Math.random().toString(36).slice(2, 10)}`;
  await prisma.payment.create({
    data: {
      orderId: order.id,
      asaasCheckoutId: checkoutId,
      billingTypes: ["PIX"],
      amountCents: 10000,
      status: "PENDING",
    },
  });

  return { order, checkoutId };
}

describe("webhook Asaas — idempotência e transições de status", () => {
  beforeEach(resetDb);
  afterAll(async () => prisma.$disconnect());

  it("CHECKOUT_PAID aprova o pedido e confirma a baixa de estoque", async () => {
    const { variant } = await createTestProduct({ stock: 5 });
    const { order, checkoutId } = await makeOrderWithPayment(variant.id, 2);

    const payload = JSON.stringify({
      id: "evt_1",
      event: "CHECKOUT_PAID",
      checkout: { id: checkoutId, externalReference: order.id },
    });

    const result = await processAsaasWebhook(payload);
    expect(result.outcome).toBe("processed");

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.paymentStatus).toBe("PAID");
    expect(updatedOrder.status).toBe("PAGAMENTO_APROVADO");

    const updatedVariant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(updatedVariant.stock).toBe(3); // 5 - 2 confirmados
  });

  it("evento com o mesmo id não é processado duas vezes (idempotência)", async () => {
    const { variant } = await createTestProduct({ stock: 5 });
    const { order, checkoutId } = await makeOrderWithPayment(variant.id, 2);

    const payload = JSON.stringify({
      id: "evt_dup",
      event: "CHECKOUT_PAID",
      checkout: { id: checkoutId, externalReference: order.id },
    });

    const first = await processAsaasWebhook(payload);
    const second = await processAsaasWebhook(payload);

    expect(first.outcome).toBe("processed");
    expect(second.outcome).toBe("duplicate");

    const updatedVariant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(updatedVariant.stock).toBe(3); // baixa aplicada apenas uma vez

    const events = await prisma.paymentEvent.count({ where: { externalEventId: "evt_dup" } });
    expect(events).toBe(1);
  });

  it("CHECKOUT_CANCELED libera a reserva de estoque sem baixar o estoque físico", async () => {
    const { variant } = await createTestProduct({ stock: 5 });
    const { order, checkoutId } = await makeOrderWithPayment(variant.id, 4);

    const payload = JSON.stringify({
      id: "evt_cancel",
      event: "CHECKOUT_CANCELED",
      checkout: { id: checkoutId, externalReference: order.id },
    });

    const result = await processAsaasWebhook(payload);
    expect(result.outcome).toBe("processed");

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.paymentStatus).toBe("CANCELED");
    expect(updatedOrder.status).toBe("CANCELADO");

    const updatedVariant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(updatedVariant.stock).toBe(5); // estoque físico não foi tocado

    const reservation = await prisma.stockReservation.findFirstOrThrow({ where: { orderId: order.id } });
    expect(reservation.status).toBe("RELEASED");
  });

  it("CHECKOUT_EXPIRED marca o pagamento como expirado", async () => {
    const { variant } = await createTestProduct({ stock: 5 });
    const { order, checkoutId } = await makeOrderWithPayment(variant.id, 1);

    await processAsaasWebhook(
      JSON.stringify({ id: "evt_exp", event: "CHECKOUT_EXPIRED", checkout: { id: checkoutId, externalReference: order.id } })
    );

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.paymentStatus).toBe("EXPIRED");
  });

  it("um cancelamento tardio após o pagamento já confirmado é ignorado (nunca reverte um pedido pago)", async () => {
    const { variant } = await createTestProduct({ stock: 5 });
    const { order, checkoutId } = await makeOrderWithPayment(variant.id, 1);

    await processAsaasWebhook(
      JSON.stringify({ id: "evt_paid", event: "CHECKOUT_PAID", checkout: { id: checkoutId, externalReference: order.id } })
    );

    const lateResult = await processAsaasWebhook(
      JSON.stringify({ id: "evt_late_cancel", event: "CHECKOUT_CANCELED", checkout: { id: checkoutId, externalReference: order.id } })
    );

    expect(lateResult.outcome).toBe("ignored");

    const updatedOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(updatedOrder.paymentStatus).toBe("PAID");
  });

  it("webhook com JSON inválido retorna erro sem lançar exceção", async () => {
    const result = await processAsaasWebhook("{ isso não é json");
    expect(result.outcome).toBe("error");
  });
});
