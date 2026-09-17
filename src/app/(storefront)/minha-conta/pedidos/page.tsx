import Link from "next/link";
import { getCurrentCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { centsToBRL } from "@/lib/money";

const ORDER_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGAMENTO_APROVADO: "Pagamento aprovado",
  EM_SEPARACAO: "Em separação",
  PRONTO_PARA_RETIRADA: "Pronto para retirada",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export default async function OrdersListPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-extrabold text-navy-900">Meus pedidos</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-tggray-600">Você ainda não fez nenhum pedido.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/pedido/${order.id}`}
              className="flex items-center justify-between rounded-xl border border-tggray-200 p-4 hover:border-blue-300"
            >
              <div>
                <p className="text-sm font-semibold text-navy-900">{order.orderNumber}</p>
                <p className="text-xs text-tggray-500">{ORDER_LABELS[order.status]}</p>
              </div>
              <span className="text-sm font-bold text-navy-900">{centsToBRL(order.totalCents)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
