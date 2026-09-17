"use client";

import { useState, useTransition } from "react";
import { addVariantAction, updateVariantStockAction, toggleVariantActiveAction } from "@/app/admin/produtos/actions";
import { SIZES } from "@/lib/constants";

interface Variant {
  id: string;
  size: string;
  sku: string;
  stock: number;
  active: boolean;
}

export function VariantManager({ productId, variants }: { productId: string; variants: Variant[] }) {
  const [newSize, setNewSize] = useState("");
  const [newStock, setNewStock] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const existingSizes = new Set(variants.map((v) => v.size));

  function handleAdd() {
    if (!newSize) return;
    startTransition(async () => {
      const result = await addVariantAction(productId, newSize, newStock);
      if (!result.success) setMessage(result.message ?? "Erro ao adicionar numeração");
      else {
        setMessage(null);
        setNewSize("");
        setNewStock(0);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-tggray-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-bold text-navy-900">Numeração e estoque</h3>

      <div className="overflow-hidden rounded-xl border border-tggray-200">
        <table className="w-full text-sm">
          <thead className="bg-tggray-50 text-left text-xs font-semibold uppercase text-tggray-500">
            <tr>
              <th className="px-3 py-2">Tamanho</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Estoque</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tggray-100">
            {variants.map((v) => (
              <VariantRow key={v.id} variant={v} />
            ))}
            {variants.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-tggray-500">Nenhuma numeração cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-navy-800">Nova numeração</label>
          <select value={newSize} onChange={(e) => setNewSize(e.target.value)} className="rounded-lg border border-tggray-200 px-3 py-2 text-sm">
            <option value="">Selecione</option>
            {SIZES.filter((s) => !existingSizes.has(s)).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="__custom__">Outra...</option>
          </select>
        </div>
        {newSize === "__custom__" && (
          <input
            placeholder="Numeração"
            onChange={(e) => setNewSize(e.target.value)}
            className="rounded-lg border border-tggray-200 px-3 py-2 text-sm"
          />
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold text-navy-800">Estoque inicial</label>
          <input
            type="number"
            min={0}
            value={newStock}
            onChange={(e) => setNewStock(Number(e.target.value))}
            className="w-24 rounded-lg border border-tggray-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={isPending || !newSize}
          onClick={handleAdd}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          Adicionar
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-red-600">{message}</p>}
    </div>
  );
}

function VariantRow({ variant }: { variant: Variant }) {
  const [stock, setStock] = useState(variant.stock);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function saveStock() {
    if (stock === variant.stock) return;
    startTransition(async () => {
      const result = await updateVariantStockAction(variant.id, stock, "Ajuste manual pelo painel");
      if (!result.success) {
        setError(result.message ?? "Erro");
        setStock(variant.stock);
      }
    });
  }

  return (
    <tr>
      <td className="px-3 py-2 font-medium text-navy-900">{variant.size}</td>
      <td className="px-3 py-2 text-xs text-tggray-500">{variant.sku}</td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          onBlur={saveStock}
          disabled={isPending}
          className="w-20 rounded-lg border border-tggray-200 px-2 py-1 text-sm"
        />
        {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={() => startTransition(() => toggleVariantActiveAction(variant.id))}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            variant.active ? "bg-green-50 text-green-600" : "bg-tggray-100 text-tggray-500"
          }`}
        >
          {variant.active ? "Ativo" : "Inativo"}
        </button>
      </td>
    </tr>
  );
}
