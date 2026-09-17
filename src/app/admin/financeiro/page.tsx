import Link from "next/link";
import { prisma } from "@/lib/db";
import { centsToBRL } from "@/lib/money";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  FAILED: "Falhou",
  REFUNDED: "Estornado",
  CANCELED: "Cancelado",
  EXPIRED: "Expirado",
};

export default async function FinancePage() {
  const [payments, totals] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 150,
      include: { order: { select: { orderNumber: true, id: true } } },
    }),
    prisma.payment.groupBy({ by: ["status"], _sum: { amountCents: true }, _count: true }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-navy-900">Financeiro</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {totals.map((t) => (
          <div key={t.status} className="rounded-2xl border border-tggray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-tggray-500">{STATUS_LABELS[t.status] ?? t.status}</p>
            <p className="mt-1 text-lg font-bold text-navy-900">{centsToBRL(t._sum.amountCents ?? 0)}</p>
            <p className="text-xs text-tggray-500">{t._count} pagamento(s)</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-tggray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-tggray-50 text-left text-xs font-semibold uppercase text-tggray-500">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tggray-100">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${p.order.id}`} className="font-semibold text-blue-600">{p.order.orderNumber}</Link>
                </td>
                <td className="px-4 py-3 text-tggray-700">{p.billingTypes.join(", ")}</td>
                <td className="px-4 py-3 font-semibold text-navy-900">{centsToBRL(p.amountCents)}</td>
                <td className="px-4 py-3 text-tggray-700">{STATUS_LABELS[p.status]}</td>
                <td className="px-4 py-3 text-tggray-600">{p.createdAt.toLocaleString("pt-BR")}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-tggray-500">Nenhum pagamento registrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
