"use client";

import { useRef, useState, useTransition } from "react";
import { createBrandAction } from "@/app/admin/marcas/actions";

export function QuickCreateBrand() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createBrandAction(formData);
      if (!result.success) setMessage(result.message ?? "Erro");
      else {
        setMessage(null);
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-2xl border border-tggray-200 bg-white p-5">
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Nome da marca</label>
        <input name="name" required className="rounded-lg border border-tggray-200 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Logo (opcional)</label>
        <input type="file" name="logo" accept="image/jpeg,image/png,image/webp" className="text-xs" />
      </div>
      <button type="submit" disabled={isPending} className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Salvando..." : "Adicionar marca"}
      </button>
      {message && <p className="w-full text-xs text-red-600">{message}</p>}
    </form>
  );
}
