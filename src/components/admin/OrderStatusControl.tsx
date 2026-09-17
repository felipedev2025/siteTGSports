"use client";

import { useState, useTransition } from "react";
import { updateOrderStatusAction } from "@/app/admin/pedidos/actions";
import type { OrderStatus } from "@prisma/client";

const NEXT_STEPS: Record<OrderStatus, { value: OrderStatus; label: string }[]> = {
  AGUARDANDO_PAGAMENTO: [{ value: "CANCELADO", label: "Cancelar pedido" }],
  PAGAMENTO_APROVADO: [
    { value: "EM_SEPARACAO", label: "Marcar em separação" },
    { value: "CANCELADO", label: "Cancelar pedido" },
  ],
  EM_SEPARACAO: [
    { value: "PRONTO_PARA_RETIRADA", label: "Pronto para retirada" },
    { value: "ENVIADO", label: "Marcar como enviado" },
    { value: "CANCELADO", label: "Cancelar pedido" },
  ],
  PRONTO_PARA_RETIRADA: [
    { value: "ENTREGUE", label: "Marcar como retirado/entregue" },
    { value: "CANCELADO", label: "Cancelar pedido" },
  ],
  ENVIADO: [
    { value: "ENTREGUE", label: "Marcar como entregue" },
    { value: "CANCELADO", label: "Cancelar pedido" },
  ],
  ENTREGUE: [],
  CANCELADO: [],
};

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const options = NEXT_STEPS[status];

  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await updateOrderStatusAction(orderId, opt.value);
              if (!result.success) setMessage(result.message ?? "Erro ao atualizar status");
            })
          }
          className={`rounded-full px-4 py-2 text-xs font-bold ${
            opt.value === "CANCELADO" ? "bg-red-50 text-red-600" : "bg-navy-900 text-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
      {message && <p className="w-full text-xs text-red-600">{message}</p>}
    </div>
  );
}
