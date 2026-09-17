import Link from "next/link";
import { getDashboardData } from "@/lib/admin/dashboard";
import { centsToBRL } from "@/lib/money";
import { StatCard } from "@/components/admin/StatCard";
import { SalesChart } from "@/components/admin/SalesChart";

const ORDER_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGAMENTO_APROVADO: "Pagamento aprovado",
  EM_SEPARACAO: "Em separação",
  PRONTO_PARA_RETIRADA: "Pronto p/ retirada",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-extrabold text-navy-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Vendas hoje" value={centsToBRL(data.salesTodayCents)} hint={`${data.salesTodayCount} pedido(s) pago(s)`} />
        <StatCard label="Vendas no mês" value={centsToBRL(data.salesMonthCents)} hint={`${data.salesMonthCount} pedido(s) pago(s)`} />
        <StatCard label="Pedidos pendentes" value={String(data.pendingCount)} tone={data.pendingCount > 0 ? "warning" : "default"} />
        <StatCard label="Pedidos pagos" value={String(data.paidCount)} />
        <StatCard label="Ticket médio" value={centsToBRL(data.avgTicketCents)} hint="Baseado nas vendas do mês" />
        <StatCard label="Estoque baixo" value={String(data.lowStockVariants.length)} tone="warning" />
        <StatCard label="Sem estoque" value={String(data.outOfStockCount)} tone="danger" />
      </div>

      <SalesChart data={data.dailySeries} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-tggray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-navy-900">Últimos pedidos</p>
            <Link href="/admin/pedidos" className="text-xs font-semibold text-blue-600">Ver todos</Link>
          </div>
          <div className="flex flex-col divide-y divide-tggray-100">
            {data.recentOrders.map((order) => (
              <Link key={order.id} href={`/admin/pedidos/${order.id}`} className="flex items-center justify-between py-2.5 text-sm hover:text-blue-600">
                <div>
                  <p className="font-medium text-navy-900">{order.orderNumber}</p>
                  <p className="text-xs text-tggray-500">{order.customerName} · {ORDER_LABELS[order.status]}</p>
                </div>
                <span className="font-semibold text-navy-900">{centsToBRL(order.totalCents)}</span>
              </Link>
            ))}
            {data.recentOrders.length === 0 && <p className="py-4 text-sm text-tggray-500">Nenhum pedido ainda.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-tggray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-navy-900">Produtos com estoque baixo</p>
            <Link href="/admin/estoque" className="text-xs font-semibold text-blue-600">Ver estoque</Link>
          </div>
          <div className="flex flex-col divide-y divide-tggray-100">
            {data.lowStockVariants.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-navy-900">{v.product.name} · Tam. {v.size}</span>
                <span className="font-semibold text-amber-600">{v.stock} un.</span>
              </div>
            ))}
            {data.lowStockVariants.length === 0 && <p className="py-4 text-sm text-tggray-500">Nenhum item com estoque baixo.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
