"use client";

import { useState, useTransition } from "react";
import { updateVariantStockAction } from "@/app/admin/produtos/actions";

export function StockRow({
  variantId,
  productName,
  size,
  sku,
  stock,
}: {
  variantId: string;
  productName: string;
  size: string;
  sku: string;
  stock: number;
}) {
  const [value, setValue] = useState(stock);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    if (value === stock) return;
    startTransition(async () => {
      const result = await updateVariantStockAction(variantId, value, "Ajuste manual — painel de estoque");
      if (!result.success) {
        setError(result.message ?? "Erro");
        setValue(stock);
      }
    });
  }

  return (
    <tr className={stock === 0 ? "bg-red-50/40" : stock <= 3 ? "bg-amber-50/40" : undefined}>
      <td className="px-4 py-2.5 font-medium text-navy-900">{productName}</td>
      <td className="px-4 py-2.5 text-tggray-600">{size}</td>
      <td className="px-4 py-2.5 text-xs text-tggray-500">{sku}</td>
      <td className="px-4 py-2.5">
        <input
          type="number"
          min={0}
          value={value}
          disabled={isPending}
          onChange={(e) => setValue(Number(e.target.value))}
          onBlur={save}
          className="w-20 rounded-lg border border-tggray-200 px-2 py-1 text-sm"
        />
        {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
      </td>
    </tr>
  );
}
