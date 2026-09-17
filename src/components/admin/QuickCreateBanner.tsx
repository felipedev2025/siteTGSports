"use client";

import { useRef, useState, useTransition } from "react";
import { createBannerAction } from "@/app/admin/banners/actions";

export function QuickCreateBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createBannerAction(formData);
      if (!result.success) setMessage(result.message ?? "Erro");
      else {
        setMessage(null);
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-2xl border border-tggray-200 bg-white p-5 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Título</label>
        <input name="title" required className="w-full rounded-lg border border-tggray-200 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Subtítulo</label>
        <input name="subtitle" className="w-full rounded-lg border border-tggray-200 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Link (opcional)</label>
        <input name="link" placeholder="/produtos?oferta=1" className="w-full rounded-lg border border-tggray-200 px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-navy-800">Imagem</label>
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required className="text-xs" />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={isPending} className="rounded-lg bg-navy-900 px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {isPending ? "Enviando..." : "Adicionar banner"}
        </button>
        {message && <span className="ml-3 text-xs text-red-600">{message}</span>}
      </div>
    </form>
  );
}
