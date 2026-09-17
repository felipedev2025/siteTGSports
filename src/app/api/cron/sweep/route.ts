import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sweepExpiredReservations, releaseStockForOrder } from "@/lib/inventory";

export const dynamic = "force-dynamic";

/**
 * Endpoint chamado periodicamente (cron externo — Vercel Cron, GitHub Actions,
 * cron-job.org, etc.) para: 1) expirar reservas de estoque vencidas e
 * 2) cancelar pedidos que ficaram AGUARDANDO_PAGAMENTO além do prazo da
 * reserva, liberando o estoque. Protegido por um secret compartilhado.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const expiredReservations = await sweepExpiredReservations();

  const staleOrders = await prisma.order.findMany({
    where: {
      status: "AGUARDANDO_PAGAMENTO",
      paymentStatus: "PENDING",
      createdAt: { lt: new Date(Date.now() - 65 * 60_000) },
    },
    select: { id: true },
  });

  for (const order of staleOrders) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELADO", paymentStatus: "EXPIRED" } });
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, status: "CANCELADO", note: "Expirado automaticamente (sem pagamento)" },
      });
      await releaseStockForOrder(tx, order.id, "EXPIRED");
    });
  }

  return NextResponse.json({
    expiredReservations,
    canceledOrders: staleOrders.length,
  });
}
