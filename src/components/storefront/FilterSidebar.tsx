"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SIZES } from "@/lib/constants";

interface FilterSidebarProps {
  brands: { slug: string; name: string }[];
  categories: { slug: string; name: string }[];
}

const SORT_OPTIONS = [
  { value: "recentes", label: "Mais recentes" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
  { value: "maior-desconto", label: "Maior desconto" },
];

export function FilterSidebar({ brands, categories }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("pagina");
    router.push(`/produtos?${params.toString()}`);
  }

  function toggleParam(key: string, value: string) {
    const current = searchParams.get(key);
    updateParam(key, current === value ? null : value);
  }

  const content = (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-tggray-600">Ordenar por</label>
        <select
          value={searchParams.get("ordenar") ?? "recentes"}
          onChange={(e) => updateParam("ordenar", e.target.value)}
          className="w-full rounded-lg border border-tggray-200 bg-white px-3 py-2 text-sm text-navy-900"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-navy-800">
          <input
            type="checkbox"
            checked={searchParams.get("oferta") === "1"}
            onChange={(e) => updateParam("oferta", e.target.checked ? "1" : null)}
            className="h-4 w-4 rounded accent-blue-600"
          />
          Somente ofertas
        </label>
      </div>

      {categories.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-tggray-600">Categoria</h3>
          <div className="flex flex-col gap-1.5">
            {categories.map((cat) => (
              <label key={cat.slug} className="flex items-center gap-2 text-sm text-navy-800">
                <input
                  type="checkbox"
                  checked={searchParams.get("categoria") === cat.slug}
                  onChange={() => toggleParam("categoria", cat.slug)}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {brands.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-tggray-600">Marca</h3>
          <div className="flex flex-col gap-1.5">
            {brands.map((brand) => (
              <label key={brand.slug} className="flex items-center gap-2 text-sm text-navy-800">
                <input
                  type="checkbox"
                  checked={searchParams.get("marca") === brand.slug}
                  onChange={() => toggleParam("marca", brand.slug)}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                {brand.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-tggray-600">Numeração</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleParam("tamanho", size)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                searchParams.get("tamanho") === size
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-tggray-200 text-navy-800 hover:border-navy-400"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-tggray-600">Gênero</h3>
        <div className="flex flex-wrap gap-2">
          {["MASCULINO", "FEMININO", "UNISSEX"].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleParam("genero", g)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                searchParams.get("genero") === g
                  ? "border-navy-900 bg-navy-900 text-white"
                  : "border-tggray-200 text-navy-800 hover:border-navy-400"
              }`}
            >
              {g.charAt(0) + g.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.push("/produtos")}
        className="text-left text-sm font-semibold text-blue-600 hover:text-blue-700"
      >
        Limpar filtros
      </button>
    </div>
  );

  return (
    <>
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-tggray-200 bg-white py-2.5 text-sm font-semibold text-navy-900"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
          </svg>
          Filtros e ordenação
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-navy-950/50" onClick={() => setMobileOpen(false)} />
            <div className="relative ml-auto flex h-full w-[85%] max-w-sm flex-col gap-6 overflow-y-auto bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-navy-900">Filtros</span>
                <button onClick={() => setMobileOpen(false)} className="h-9 w-9 text-navy-900">
                  ✕
                </button>
              </div>
              {content}
            </div>
          </div>
        )}
      </div>
      <aside className="hidden w-64 shrink-0 lg:block">{content}</aside>
    </>
  );
}
