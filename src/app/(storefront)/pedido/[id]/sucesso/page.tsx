import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

// Esta página é apenas o destino de retorno do checkout do Asaas
// (callback.successUrl). Ela NUNCA confirma pagamento — a confirmação
// real só acontece via Webhook (ver /api/webhooks/asaas). Aqui só
// informamos que o pedido está aguardando a confirmação.
export default async function OrderSuccessPage({ params }: PageProps<"/pedido/[id]/sucesso">) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, select: { orderNumber: true } });
  if (!order) notFound();

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="mt-5 text-2xl font-extrabold text-navy-900">Recebemos seu pedido!</h1>
      <p className="mt-2 text-sm text-tggray-600">
        Pedido <strong>{order.orderNumber}</strong> registrado. Assim que a confirmação do pagamento chegar,
        atualizaremos o status automaticamente.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href={`/pedido/${id}`} className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white">
          Acompanhar pedido
        </Link>
        <Link href="/" className="rounded-full border border-tggray-200 px-6 py-3 text-sm font-bold text-navy-900">
          Voltar à loja
        </Link>
      </div>
    </div>
  );
}
