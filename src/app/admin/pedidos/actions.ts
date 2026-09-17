"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { notificationService, type NotificationEvent } from "@/lib/notifications/notification-service";
import type { OrderStatus } from "@prisma/client";

const STATUS_NOTIFICATION_EVENT: Partial<Record<OrderStatus, NotificationEvent>> = {
  EM_SEPARACAO: "ORDER_PACKING",
  ENVIADO: "ORDER_SHIPPED",
  PRONTO_PARA_RETIRADA: "ORDER_READY_FOR_PICKUP",
};

export interface ActionState {
  success: boolean;
  message?: string;
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  AGUARDANDO_PAGAMENTO: ["CANCELADO"],
  PAGAMENTO_APROVADO: ["EM_SEPARACAO", "CANCELADO"],
  EM_SEPARACAO: ["PRONTO_PARA_RETIRADA", "ENVIADO", "CANCELADO"],
  PRONTO_PARA_RETIRADA: ["ENTREGUE", "CANCELADO"],
  ENVIADO: ["ENTREGUE", "CANCELADO"],
  ENTREGUE: [],
  CANCELADO: [],
};

export async function updateOrderStatusAction(orderId: string, newStatus: OrderStatus, note?: string): Promise<ActionState> {
  const user = await requireUser();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: "Pedido não encontrado." };

  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    return { success: false, message: `Não é possível mudar de "${order.status}" para "${newStatus}".` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: newStatus } });
    await tx.orderStatusHistory.create({
      data: { orderId, status: newStatus, note: note || undefined, userId: user.id },
    });

    if (newStatus === "CANCELADO" && order.paymentStatus !== "PAID") {
      await tx.stockReservation.updateMany({ where: { orderId, status: "ACTIVE" }, data: { status: "RELEASED" } });
    }
  });

  await recordAudit({
    userId: user.id,
    action: "UPDATE_STATUS",
    entityType: "Order",
    entityId: orderId,
    before: { status: order.status },
    after: { status: newStatus },
  });

  const notificationEvent = STATUS_NOTIFICATION_EVENT[newStatus];
  if (notificationEvent) {
    await notificationService
      .send({
        event: notificationEvent,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
      })
      .catch((err) => console.error("[notification] falha ao notificar mudança de status", err));
  }

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
  return { success: true };
}
