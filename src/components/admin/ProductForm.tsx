"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProductAction, updateProductAction } from "@/app/admin/produtos/actions";

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  initial?: {
    name: string;
    slug: string;
    sku: string;
    brandId: string | null;
    shortDescription: string | null;
    description: string | null;
    costPriceCents: number | null;
    priceCents: number;
    compareAtCents: number | null;
    pixDiscountPercent: number;
    gender: string | null;
    isFeatured: boolean;
    isOnSale: boolean;
    isNew: boolean;
    status: "ACTIVE" | "INACTIVE";
    metaTitle: string | null;
    metaDescription: string | null;
    categoryIds: string[];
  };
}

const inputClass = "w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500";
const labelClass = "mb-1 block text-xs font-semibold text-navy-800";

export function ProductForm({ mode, productId, brands, categories, initial }: ProductFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result =
        mode === "create" ? await createProductAction(formData) : await updateProductAction(productId!, formData);
      if (result && !result.success) {
        setMessage(result.message ?? "Erro ao salvar produto");
      } else if (result?.success) {
        setMessage(result.message ?? "Salvo com sucesso");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-tggray-200 bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Nome do produto</label>
          <input name="name" required defaultValue={initial?.name} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Slug (URL amigável)</label>
          <input name="slug" defaultValue={initial?.slug} placeholder="gerado automaticamente" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>SKU</label>
          <input name="sku" required defaultValue={initial?.sku} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Marca</label>
          <select name="brandId" defaultValue={initial?.brandId ?? ""} className={inputClass}>
            <option value="">Sem marca</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Gênero</label>
          <select name="gender" defaultValue={initial?.gender ?? ""} className={inputClass}>
            <option value="">—</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMININO">Feminino</option>
            <option value="UNISSEX">Unissex</option>
            <option value="INFANTIL">Infantil</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Descrição curta</label>
          <input name="shortDescription" defaultValue={initial?.shortDescription ?? ""} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Descrição completa</label>
          <textarea name="description" rows={5} defaultValue={initial?.description ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-tggray-200 bg-white p-5 sm:grid-cols-3">
        <h3 className="sm:col-span-3 text-sm font-bold text-navy-900">Preços</h3>
        <div>
          <label className={labelClass}>Preço de custo (R$)</label>
          <input type="number" step="0.01" name="costPriceCents" defaultValue={initial ? initial.costPriceCents ?? undefined : undefined} className={inputClass} data-cents />
        </div>
        <div>
          <label className={labelClass}>Preço de venda (R$)</label>
          <input type="number" step="0.01" required name="priceCentsDisplay" defaultValue={initial ? initial.priceCents / 100 : undefined} className={inputClass} onChange={(e) => {
            const hidden = e.currentTarget.form?.elements.namedItem("priceCents") as HTMLInputElement;
            if (hidden) hidden.value = String(Math.round(Number(e.currentTarget.value) * 100));
          }} />
          <input type="hidden" name="priceCents" defaultValue={initial?.priceCents} />
        </div>
        <div>
          <label className={labelClass}>Preço &ldquo;de&rdquo; (comparação/promoção)</label>
          <input type="number" step="0.01" name="compareAtCentsDisplay" defaultValue={initial?.compareAtCents ? initial.compareAtCents / 100 : undefined} className={inputClass} onChange={(e) => {
            const hidden = e.currentTarget.form?.elements.namedItem("compareAtCents") as HTMLInputElement;
            if (hidden) hidden.value = e.currentTarget.value ? String(Math.round(Number(e.currentTarget.value) * 100)) : "";
          }} />
          <input type="hidden" name="compareAtCents" defaultValue={initial?.compareAtCents ?? undefined} />
        </div>
        <div>
          <label className={labelClass}>Desconto adicional no PIX (%)</label>
          <input type="number" name="pixDiscountPercent" min={0} max={100} defaultValue={initial?.pixDiscountPercent ?? 0} className={inputClass} />
        </div>
      </div>

      <div className="rounded-2xl border border-tggray-200 bg-white p-5">
        <h3 className="mb-3 text-sm font-bold text-navy-900">Categorias</h3>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm text-navy-800">
              <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={initial?.categoryIds.includes(c.id)} className="h-4 w-4 accent-blue-600" />
              {c.name}
            </label>
          ))}
          {categories.length === 0 && <p className="text-sm text-tggray-500">Nenhuma categoria cadastrada ainda.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-tggray-200 bg-white p-5 sm:grid-cols-2">
        <h3 className="sm:col-span-2 text-sm font-bold text-navy-900">Visibilidade</h3>
        <label className="flex items-center gap-2 text-sm text-navy-800">
          <input type="checkbox" name="isFeatured" defaultChecked={initial?.isFeatured} className="h-4 w-4 accent-blue-600" />
          Produto em destaque (mais vendidos)
        </label>
        <label className="flex items-center gap-2 text-sm text-navy-800">
          <input type="checkbox" name="isOnSale" defaultChecked={initial?.isOnSale} className="h-4 w-4 accent-blue-600" />
          Produto em promoção (badge Oferta)
        </label>
        <label className="flex items-center gap-2 text-sm text-navy-800">
          <input type="checkbox" name="isNew" defaultChecked={initial?.isNew} className="h-4 w-4 accent-blue-600" />
          Produto novo (badge Novo)
        </label>
        <div>
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={initial?.status ?? "ACTIVE"} className={inputClass}>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-tggray-200 bg-white p-5 sm:grid-cols-2">
        <h3 className="sm:col-span-2 text-sm font-bold text-navy-900">SEO</h3>
        <div>
          <label className={labelClass}>Meta título</label>
          <input name="metaTitle" defaultValue={initial?.metaTitle ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Meta descrição</label>
          <input name="metaDescription" defaultValue={initial?.metaDescription ?? ""} className={inputClass} />
        </div>
      </div>

      {message && <p className="text-sm font-medium text-blue-700">{message}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-full bg-blue-600 px-8 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Salvando..." : mode === "create" ? "Criar produto" : "Salvar alterações"}
      </button>
    </form>
  );
}
