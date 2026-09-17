import "server-only";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

export class OutOfStockError extends Error {
  constructor(public variantId: string, public available: number, public requested: number) {
    super(`Estoque insuficiente para a variação ${variantId}: disponível ${available}, solicitado ${requested}`);
    this.name = "OutOfStockError";
  }
}

type Tx = Prisma.TransactionClient | PrismaClient;

/** Estoque disponível = estoque físico - reservas ativas e não expiradas. */
export async function getAvailableStock(variantId: string, tx: Tx = prisma): Promise<number> {
  const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  const reserved = await tx.stockReservation.aggregate({
    where: { variantId, status: "ACTIVE", expiresAt: { gt: new Date() } },
    _sum: { quantity: true },
  });
  return variant.stock - (reserved._sum.quantity ?? 0);
}

export async function getAvailableStockMap(variantIds: string[], tx: Tx = prisma): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();
  const variants = await tx.productVariant.findMany({ where: { id: { in: variantIds } } });
  const reservations = await tx.stockReservation.groupBy({
    by: ["variantId"],
    where: { variantId: { in: variantIds }, status: "ACTIVE", expiresAt: { gt: new Date() } },
    _sum: { quantity: true },
  });
  const reservedMap = new Map(reservations.map((r) => [r.variantId, r._sum.quantity ?? 0]));
  return new Map(variants.map((v) => [v.id, v.stock - (reservedMap.get(v.id) ?? 0)]));
}

/**
 * Reserva estoque para os itens de um pedido dentro de uma transação.
 * Bloqueia a linha da variação (FOR UPDATE) para evitar overselling em
 * requisições concorrentes, revalida a disponibilidade e só então grava a
 * reserva. Lança OutOfStockError se não houver quantidade suficiente —
 * a transação inteira (incluindo a criação do pedido) deve ser revertida
 * pelo chamador.
 */
export async function reserveStockForOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  items: { variantId: string; quantity: number }[],
  ttlMinutes: number
) {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

  for (const item of items) {
    // Lock pessimista da linha da variação — impede duas transações
    // concorrentes de lerem o mesmo estoque "livre" simultaneamente.
    await tx.$queryRaw`SELECT id FROM product_variants WHERE id = ${item.variantId} FOR UPDATE`;

    const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: item.variantId } });
    const reserved = await tx.stockReservation.aggregate({
      where: { variantId: item.variantId, status: "ACTIVE", expiresAt: { gt: new Date() } },
      _sum: { quantity: true },
    });
    const available = variant.stock - (reserved._sum.quantity ?? 0);

    if (available < item.quantity) {
      throw new OutOfStockError(item.variantId, available, item.quantity);
    }

    await tx.stockReservation.create({
      data: {
        variantId: item.variantId,
        orderId,
        quantity: item.quantity,
        status: "ACTIVE",
        expiresAt,
      },
    });
  }
}

/** Confirma reservas de um pedido pago: baixa definitiva do estoque físico. */
export async function confirmStockForOrder(tx: Prisma.TransactionClient, orderId: string) {
  const reservations = await tx.stockReservation.findMany({
    where: { orderId, status: "ACTIVE" },
  });

  for (const reservation of reservations) {
    await tx.stockReservation.update({
      where: { id: reservation.id },
      data: { status: "CONFIRMED" },
    });
    await tx.productVariant.update({
      where: { id: reservation.variantId },
      data: { stock: { decrement: reservation.quantity } },
    });
    await tx.inventoryMovement.create({
      data: {
        variantId: reservation.variantId,
        type: "OUT",
        quantity: reservation.quantity,
        reason: `Venda confirmada - pedido ${orderId}`,
        orderId,
      },
    });
  }
}

/** Libera reservas de um pedido cancelado/expirado (estoque físico não havia sido decrementado). */
export async function releaseStockForOrder(tx: Prisma.TransactionClient, orderId: string, toStatus: "RELEASED" | "EXPIRED" = "RELEASED") {
  await tx.stockReservation.updateMany({
    where: { orderId, status: "ACTIVE" },
    data: { status: toStatus },
  });
}

/** Varredura de reservas expiradas — chamar periodicamente (cron) ou antes de checar disponibilidade. */
export async function sweepExpiredReservations() {
  const result = await prisma.stockReservation.updateMany({
    where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
  return result.count;
}
