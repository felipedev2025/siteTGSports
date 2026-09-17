import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { centsToBRL } from "@/lib/money";

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  PAID: "Pago",
  FAILED: "Falhou",
  REFUNDED: "Estornado",
  CANCELED: "Cancelado",
  EXPIRED: "Expirado",
};

const ORDER_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGAMENTO_APROVADO: "Pagamento aprovado",
  EM_SEPARACAO: "Em separação",
  PRONTO_PARA_RETIRADA: "Pronto para retirada",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export default async function OrderStatusPage({ params }: PageProps<"/pedido/[id]">) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) notFound();

  const payment = order.payments[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <div className="rounded-2xl border border-tggray-200 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Pedido {order.orderNumber}</p>
        <h1 className="mt-1 text-2xl font-extrabold text-navy-900">{ORDER_LABELS[order.status]}</h1>
        <p className="mt-1 text-sm text-tggray-600">
          Pagamento: <strong>{PAYMENT_LABELS[order.paymentStatus]}</strong>
        </p>

        {order.paymentStatus === "PENDING" && payment?.checkoutUrl && (
          <a
            href={payment.checkoutUrl}
            className="mt-4 inline-block rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white"
          >
            Continuar pagamento
          </a>
        )}

        <div className="mt-6 divide-y divide-tggray-100 border-y border-tggray-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-navy-900">{item.productName}</p>
                <p className="text-xs text-tggray-500">Tam. {item.variantName} · Qtd {item.quantity}</p>
              </div>
              <span className="font-semibold text-navy-900">{centsToBRL(item.subtotalCents)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between text-tggray-700">
            <span>Subtotal</span>
            <span>{centsToBRL(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Desconto</span>
              <span>-{centsToBRL(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-tggray-700">
            <span>Frete</span>
            <span>{order.shippingCents === 0 ? "Grátis" : centsToBRL(order.shippingCents)}</span>
          </div>
          <div className="flex justify-between border-t border-tggray-200 pt-2 text-base font-bold text-navy-900">
            <span>Total</span>
            <span>{centsToBRL(order.totalCents)}</span>
          </div>
        </div>

        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline">
          ← Voltar à loja
        </Link>
      </div>
    </div>
  );
}
