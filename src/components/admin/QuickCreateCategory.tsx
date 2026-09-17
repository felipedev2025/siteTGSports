"use client";

import { useRef, useState, useTransition } from "react";
import { createCategoryAction } from "@/app/admin/categorias/actions";

export function QuickCreateCategory({ parents }: { parents: { id: string; name: string }[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createCategoryAction(formData);
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
        <label className="mb-1 block text-xs font-semibold text-navy-800">Nome da categoria</label>
        <input name="name" required className="rounded-lg border border-tggray-200 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Categoria pai (opcional)</label>
        <select name="parentId" className="rounded-lg border border-tggray-200 px-3 py-2 text-sm">
          <option value="">Nenhuma (categoria principal)</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={isPending} className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Salvando..." : "Adicionar categoria"}
      </button>
      {message && <p className="w-full text-xs text-red-600">{message}</p>}
    </form>
  );
}
