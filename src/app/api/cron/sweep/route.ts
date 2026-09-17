import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sweepExpiredReservations, releaseStockForOrder } from "@/lib/inventory";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  if (!process.env.CRON_SECRET) return false;

  // Vercel Cron Jobs chamam via GET e injetam automaticamente
  // `Authorization: Bearer <CRON_SECRET>` (usando a env var CRON_SECRET do projeto).
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;

  // Chamada manual/externa (GitHub Actions, cron-job.org, curl, etc.).
  const legacyHeader = req.headers.get("x-cron-secret");
  return legacyHeader === process.env.CRON_SECRET;
}

async function runSweep() {
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

  return { expiredReservations, canceledOrders: staleOrders.length };
}

/**
 * Endpoint chamado periodicamente (Vercel Cron, GitHub Actions, cron-job.org,
 * etc.) para: 1) expirar reservas de estoque vencidas e 2) cancelar pedidos
 * que ficaram AGUARDANDO_PAGAMENTO além do prazo da reserva, liberando o
 * estoque. Aceita GET (Vercel Cron) e POST (chamada manual/externa) — ambos
 * exigem autenticação por CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await runSweep());
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await runSweep());
}
