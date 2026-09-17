import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { centsToBRL } from "@/lib/money";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";

const ORDER_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGAMENTO_APROVADO: "Pagamento aprovado",
  EM_SEPARACAO: "Em separação",
  PRONTO_PARA_RETIRADA: "Pronto p/ retirada",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export default async function AdminOrderDetailPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
      coupon: true,
    },
  });
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/pedidos" className="text-xs font-semibold text-blue-600">← Pedidos</Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-navy-900">Pedido {order.orderNumber}</h1>
          <OrderStatusControl orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-2xl border border-tggray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-navy-900">Itens do pedido</h2>
            <div className="divide-y divide-tggray-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-navy-900">{item.productName}</p>
                    <p className="text-xs text-tggray-500">Tam. {item.variantName} · SKU {item.sku} · Qtd {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-navy-900">{centsToBRL(item.subtotalCents)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-tggray-100 pt-3 text-sm">
              <div className="flex justify-between text-tggray-700"><span>Subtotal</span><span>{centsToBRL(order.subtotalCents)}</span></div>
              {order.discountCents > 0 && (
                <div className="flex justify-between text-green-600"><span>Desconto {order.couponCode ? `(${order.couponCode})` : ""}</span><span>-{centsToBRL(order.discountCents)}</span></div>
              )}
              <div className="flex justify-between text-tggray-700"><span>Frete</span><span>{centsToBRL(order.shippingCents)}</span></div>
              <div className="flex justify-between border-t border-tggray-200 pt-1 text-base font-bold text-navy-900"><span>Total</span><span>{centsToBRL(order.totalCents)}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-tggray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-navy-900">Histórico do pedido</h2>
            <div className="flex flex-col gap-2">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="flex items-start justify-between text-xs">
                  <div>
                    <p className="font-medium text-navy-900">{ORDER_LABELS[h.status]}</p>
                    {h.note && <p className="text-tggray-500">{h.note}</p>}
                  </div>
                  <span className="shrink-0 text-tggray-400">{h.createdAt.toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-tggray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-navy-900">Cliente</h2>
            <p className="text-sm text-navy-900">{order.customerName}</p>
            <p className="text-xs text-tggray-600">{order.customerEmail}</p>
            <p className="text-xs text-tggray-600">{order.customerPhone}</p>
            <p className="text-xs text-tggray-600">CPF: {order.customerCpf}</p>
          </div>

          <div className="rounded-2xl border border-tggray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-navy-900">Entrega</h2>
            {order.deliveryType === "PICKUP" ? (
              <p className="text-sm text-tggray-700">Retirada na loja</p>
            ) : (
              <p className="text-sm text-tggray-700">
                {order.shippingStreet}, {order.shippingNumber} {order.shippingComplement}
                <br />
                {order.shippingDistrict} — {order.shippingCity}/{order.shippingState}
                <br />
                CEP {order.shippingCep}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-tggray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-navy-900">Pagamento</h2>
            {order.payments.map((p) => (
              <div key={p.id} className="mb-2 text-xs text-tggray-700">
                <p><strong>Status:</strong> {p.status}</p>
                <p><strong>Método:</strong> {p.billingTypes.join(", ")}</p>
                <p><strong>Valor:</strong> {centsToBRL(p.amountCents)}</p>
                {p.asaasCheckoutId && <p><strong>Checkout Asaas:</strong> {p.asaasCheckoutId}</p>}
                {p.asaasPaymentId && <p><strong>Pagamento Asaas:</strong> {p.asaasPaymentId}</p>}
              </div>
            ))}
            {order.payments.length === 0 && <p className="text-xs text-tggray-500">Nenhum pagamento iniciado.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
