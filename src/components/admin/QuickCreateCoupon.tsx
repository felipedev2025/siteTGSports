"use client";

import { useRef, useState, useTransition } from "react";
import { createCouponAction } from "@/app/admin/cupons/actions";

export function QuickCreateCoupon() {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createCouponAction(formData);
      if (!result.success) setMessage(result.message ?? "Erro");
      else {
        setMessage(null);
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 rounded-2xl border border-tggray-200 bg-white p-5 sm:grid-cols-6">
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Código</label>
        <input name="code" required placeholder="TGSPORTS10" className="w-full rounded-lg border border-tggray-200 px-3 py-2 text-sm uppercase" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Tipo</label>
        <select name="type" value={type} onChange={(e) => setType(e.target.value as "PERCENT" | "FIXED")} className="w-full rounded-lg border border-tggray-200 px-3 py-2 text-sm">
          <option value="PERCENT">Percentual (%)</option>
          <option value="FIXED">Valor fixo (R$)</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Valor {type === "PERCENT" ? "(%)" : "(R$)"}</label>
        <input type="number" step={type === "PERCENT" ? 1 : 0.01} name="value" required className="w-full rounded-lg border border-tggray-200 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Compra mínima (R$)</label>
        <input type="number" step={0.01} name="minPurchase" className="w-full rounded-lg border border-tggray-200 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Máx. usos</label>
        <input type="number" name="maxUses" className="w-full rounded-lg border border-tggray-200 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Validade</label>
        <input type="date" name="expiresAt" className="w-full rounded-lg border border-tggray-200 px-3 py-2 text-sm" />
      </div>
      <div className="col-span-2 sm:col-span-6">
        <button type="submit" disabled={isPending} className="rounded-lg bg-navy-900 px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {isPending ? "Salvando..." : "Criar cupom"}
        </button>
        {message && <span className="ml-3 text-xs text-red-600">{message}</span>}
      </div>
    </form>
  );
}
