import "server-only";
import { prisma } from "@/lib/db";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const sevenDaysAgo = new Date(now.getTime() - 6 * 86_400_000);

  const [
    salesToday,
    salesMonth,
    pendingCount,
    paidCount,
    lowStockVariants,
    outOfStockCount,
    recentOrders,
    last7DaysOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: todayStart } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: monthStart } },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.order.count({ where: { paymentStatus: "PENDING" } }),
    prisma.order.count({ where: { paymentStatus: "PAID" } }),
    prisma.productVariant.findMany({
      where: { active: true, stock: { gt: 0, lte: 3 } },
      include: { product: { select: { name: true } } },
      take: 8,
      orderBy: { stock: "asc" },
    }),
    prisma.productVariant.count({ where: { active: true, stock: 0 } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, orderNumber: true, customerName: true, totalCents: true, status: true, paymentStatus: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: startOfDay(sevenDaysAgo) } },
      select: { totalCents: true, createdAt: true },
    }),
  ]);

  const dailySeries: { date: string; totalCents: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(new Date(now.getTime() - i * 86_400_000));
    const nextDay = new Date(day.getTime() + 86_400_000);
    const total = last7DaysOrders
      .filter((o) => o.createdAt >= day && o.createdAt < nextDay)
      .reduce((s, o) => s + o.totalCents, 0);
    dailySeries.push({ date: day.toLocaleDateString("pt-BR", { weekday: "short" }), totalCents: total });
  }

  const avgTicketCents = salesMonth._count > 0 ? Math.round((salesMonth._sum.totalCents ?? 0) / salesMonth._count) : 0;

  return {
    salesTodayCents: salesToday._sum.totalCents ?? 0,
    salesTodayCount: salesToday._count,
    salesMonthCents: salesMonth._sum.totalCents ?? 0,
    salesMonthCount: salesMonth._count,
    pendingCount,
    paidCount,
    avgTicketCents,
    lowStockVariants,
    outOfStockCount,
    recentOrders,
    dailySeries,
  };
}
