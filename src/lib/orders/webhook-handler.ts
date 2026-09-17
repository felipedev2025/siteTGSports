import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { confirmStockForOrder, releaseStockForOrder } from "@/lib/inventory";
import { notificationService } from "@/lib/notifications/notification-service";

interface AsaasWebhookPayload {
  id?: string;
  event: string;
  checkout?: { id: string; status?: string; externalReference?: string };
  payment?: { id: string; status?: string; externalReference?: string; checkout?: string };
}

const PAID_EVENTS = new Set(["CHECKOUT_PAID", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const CANCELED_EVENTS = new Set(["CHECKOUT_CANCELED", "PAYMENT_DELETED"]);
const EXPIRED_EVENTS = new Set(["CHECKOUT_EXPIRED", "PAYMENT_OVERDUE"]);
const REFUNDED_EVENTS = new Set(["PAYMENT_REFUNDED"]);

export type WebhookProcessResult =
  | { outcome: "duplicate" }
  | { outcome: "ignored"; reason: string }
  | { outcome: "processed"; action: string }
  | { outcome: "error"; reason: string };

export async function processAsaasWebhook(rawBody: string): Promise<WebhookProcessResult> {
  let payload: AsaasWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { outcome: "error", reason: "JSON inválido" };
  }

  const entity = payload.checkout ?? payload.payment;
  const entityId = entity?.id ?? "unknown";
  // Chave de idempotência: usa o id do evento quando disponível; caso
  // contrário, deriva uma chave estável do tipo de evento + entidade, o que
  // ainda garante que a MESMA notificação reenviada (at-least-once delivery)
  // não seja processada duas vezes.
  const dedupeKey = payload.id ?? `${payload.event}:${entityId}`;

  let eventRecord;
  try {
    eventRecord = await prisma.paymentEvent.create({
      data: {
        externalEventId: dedupeKey,
        eventType: payload.event,
        paymentExternalId: payload.payment?.id,
        externalReference: payload.checkout?.externalReference ?? payload.payment?.externalReference,
        payload: payload as unknown as Prisma.InputJsonValue,
        status: "RECEIVED",
      },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { outcome: "duplicate" };
    }
    throw err;
  }

  try {
    const result = await handleEvent(payload);
    await prisma.paymentEvent.update({
      where: { id: eventRecord.id },
      data: { status: result.outcome === "error" ? "ERROR" : "PROCESSED", processedAt: new Date() },
    });
    return result;
  } catch (err) {
    await prisma.paymentEvent.update({
      where: { id: eventRecord.id },
      data: { status: "ERROR", error: err instanceof Error ? err.message : String(err), processedAt: new Date() },
    });
    throw err;
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";
}

async function handleEvent(payload: AsaasWebhookPayload): Promise<WebhookProcessResult> {
  const checkoutId = payload.checkout?.id;
  const paymentExternalId = payload.payment?.id;
  const externalReference = payload.checkout?.externalReference ?? payload.payment?.externalReference;

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        checkoutId ? { asaasCheckoutId: checkoutId } : undefined,
        paymentExternalId ? { asaasPaymentId: paymentExternalId } : undefined,
        externalReference ? { orderId: externalReference } : undefined,
      ].filter(Boolean) as Prisma.PaymentWhereInput[],
    },
    include: { order: true },
  });

  if (!payment) {
    return { outcome: "error", reason: `Pagamento não encontrado para evento ${payload.event}` };
  }

  // Garante que o payment_id do Asaas fique salvo assim que soubermos dele.
  if (paymentExternalId && payment.asaasPaymentId !== paymentExternalId) {
    await prisma.payment.update({ where: { id: payment.id }, data: { asaasPaymentId: paymentExternalId } });
  }

  const event = payload.event;

  if (PAID_EVENTS.has(event)) {
    return markPaid(payment.id, payment.orderId, payment.order.paymentStatus);
  }
  if (CANCELED_EVENTS.has(event)) {
    return markUnsuccessful(payment.id, payment.orderId, payment.order.paymentStatus, "CANCELED");
  }
  if (EXPIRED_EVENTS.has(event)) {
    return markUnsuccessful(payment.id, payment.orderId, payment.order.paymentStatus, "EXPIRED");
  }
  if (REFUNDED_EVENTS.has(event)) {
    return markRefunded(payment.id, payment.orderId, payment.order.paymentStatus);
  }

  return { outcome: "ignored", reason: `Evento não tratado: ${event}` };
}

async function markPaid(paymentId: string, orderId: string, currentPaymentStatus: string): Promise<WebhookProcessResult> {
  if (currentPaymentStatus === "PAID") return { outcome: "ignored", reason: "Pedido já estava pago" };

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { status: "PAID" } });
    await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", status: "PAGAMENTO_APROVADO" },
    });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "PAGAMENTO_APROVADO", note: "Pagamento confirmado via webhook Asaas" },
    });
    await confirmStockForOrder(tx, orderId);
  });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order) {
    await notificationService
      .send({
        event: "PAYMENT_APPROVED",
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
      })
      .catch((err) => console.error("[notification] falha ao notificar pagamento aprovado", err));
  }

  return { outcome: "processed", action: "PAID" };
}

async function markUnsuccessful(
  paymentId: string,
  orderId: string,
  currentPaymentStatus: string,
  status: "CANCELED" | "EXPIRED"
): Promise<WebhookProcessResult> {
  if (currentPaymentStatus === "PAID") {
    return { outcome: "ignored", reason: "Pedido já pago — evento de cancelamento/expiração tardio ignorado" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { status } });
    await tx.order.update({ where: { id: orderId }, data: { paymentStatus: status, status: "CANCELADO" } });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "CANCELADO", note: `Pagamento ${status === "CANCELED" ? "cancelado" : "expirado"} (Asaas)` },
    });
    await releaseStockForOrder(tx, orderId, status === "EXPIRED" ? "EXPIRED" : "RELEASED");
  });

  return { outcome: "processed", action: status };
}

async function markRefunded(paymentId: string, orderId: string, currentPaymentStatus: string): Promise<WebhookProcessResult> {
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { status: "REFUNDED" } });
    await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "REFUNDED", status: "CANCELADO" } });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "CANCELADO", note: "Pagamento estornado (Asaas) — pedido cancelado" },
    });

    if (currentPaymentStatus === "PAID") {
      // Estoque já havia sido baixado na confirmação do pagamento — devolve ao estoque.
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        if (!item.variantId) continue;
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            type: "IN",
            quantity: item.quantity,
            reason: `Estorno - pedido ${orderId}`,
            orderId,
          },
        });
      }
    } else {
      await releaseStockForOrder(tx, orderId, "RELEASED");
    }
  });

  return { outcome: "processed", action: "REFUNDED" };
}
