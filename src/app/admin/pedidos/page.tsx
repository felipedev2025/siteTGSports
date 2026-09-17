import Link from "next/link";
import { prisma } from "@/lib/db";
import { centsToBRL } from "@/lib/money";
import type { Prisma, OrderStatus } from "@prisma/client";

const ORDER_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGAMENTO_APROVADO: "Pagamento aprovado",
  EM_SEPARACAO: "Em separação",
  PRONTO_PARA_RETIRADA: "Pronto p/ retirada",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  FAILED: "Falhou",
  REFUNDED: "Estornado",
  CANCELED: "Cancelado",
  EXPIRED: "Expirado",
};

const FILTERS = [
  { key: "", label: "Todos" },
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mês" },
  { key: "pendentes", label: "Pendentes" },
  { key: "pagos", label: "Pagos" },
  { key: "separacao", label: "Em separação" },
  { key: "enviados", label: "Enviados" },
  { key: "cancelados", label: "Cancelados" },
];

function buildWhere(filter?: string): Prisma.OrderWhereInput {
  const now = new Date();
  switch (filter) {
    case "hoje": {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      return { createdAt: { gte: start } };
    }
    case "semana": {
      const start = new Date(now.getTime() - 7 * 86_400_000);
      return { createdAt: { gte: start } };
    }
    case "mes": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { createdAt: { gte: start } };
    }
    case "pendentes":
      return { paymentStatus: "PENDING" };
    case "pagos":
      return { paymentStatus: "PAID" };
    case "separacao":
      return { status: "EM_SEPARACAO" as OrderStatus };
    case "enviados":
      return { status: "ENVIADO" as OrderStatus };
    case "cancelados":
      return { status: "CANCELADO" as OrderStatus };
    default:
      return {};
  }
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const filter = sp.filtro ?? "";

  const orders = await prisma.order.findMany({
    where: buildWhere(filter),
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-navy-900">Pedidos</h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/admin/pedidos?filtro=${f.key}` : "/admin/pedidos"}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
              filter === f.key ? "border-navy-900 bg-navy-900 text-white" : "border-tggray-200 text-navy-800"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-tggray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-tggray-50 text-left text-xs font-semibold uppercase text-tggray-500">
            <tr>
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Entrega</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tggray-100">
            {orders.map((o) => (
              <tr key={o.id} className="cursor-pointer hover:bg-tggray-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-blue-600">{o.orderNumber}</Link>
                </td>
                <td className="px-4 py-3 text-navy-800">{o.customerName}</td>
                <td className="px-4 py-3 text-tggray-600">{o.createdAt.toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 font-semibold text-navy-900">{centsToBRL(o.totalCents)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.paymentStatus === "PAID" ? "bg-green-50 text-green-600" : o.paymentStatus === "PENDING" ? "bg-amber-50 text-amber-600" : "bg-tggray-100 text-tggray-500"}`}>
                    {PAYMENT_LABELS[o.paymentStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-tggray-700">{ORDER_LABELS[o.status]}</td>
                <td className="px-4 py-3 text-tggray-700">{o.deliveryType === "PICKUP" ? "Retirada" : "Entrega"}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-tggray-500">Nenhum pedido encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
