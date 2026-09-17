import type { Metadata } from "next";
import Link from "next/link";
import { listProducts, type CatalogFilters } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/storefront/ProductCard";
import { FilterSidebar } from "@/components/storefront/FilterSidebar";

export const metadata: Metadata = {
  title: "Catálogo de tênis e calçados esportivos",
};

type SearchParams = Record<string, string | string[] | undefined>;

function parseFilters(sp: SearchParams): CatalogFilters {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  return {
    q: get("q"),
    brand: get("marca"),
    category: get("categoria"),
    gender: get("genero"),
    size: get("tamanho"),
    onSale: get("oferta") === "1",
    sort: (get("ordenar") as CatalogFilters["sort"]) ?? "recentes",
    page: get("pagina") ? Number(get("pagina")) : 1,
  };
}

export default async function ProductsPage({ searchParams }: PageProps<"/produtos">) {
  const sp = (await searchParams) as SearchParams;
  const filters = parseFilters(sp);

  const [{ items, total, page, pageCount }, brands, categories] = await Promise.all([
    listProducts(filters),
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { position: "asc" }, select: { slug: true, name: true } }),
  ]);

  const title = filters.q
    ? `Resultados para "${filters.q}"`
    : filters.onSale
      ? "Ofertas"
      : filters.category
        ? categories.find((c) => c.slug === filters.category)?.name ?? "Produtos"
        : "Todos os produtos";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <nav className="mb-4 text-xs text-tggray-500">
        <Link href="/" className="hover:text-blue-600">Início</Link> / <span className="text-navy-800">{title}</span>
      </nav>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">{title}</h1>
        <span className="text-sm text-tggray-600">{total} produto{total !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <FilterSidebar brands={brands} categories={categories} />

        <div className="flex-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-tggray-200 py-24 text-center">
              <p className="text-lg font-semibold text-navy-800">Nenhum produto encontrado</p>
              <p className="mt-1 text-sm text-tggray-600">Tente ajustar os filtros ou buscar por outro termo.</p>
              <Link href="/produtos" className="mt-4 text-sm font-semibold text-blue-600">Limpar filtros</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {pageCount > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
                    const params = new URLSearchParams(sp as Record<string, string>);
                    params.set("pagina", String(p));
                    return (
                      <Link
                        key={p}
                        href={`/produtos?${params.toString()}`}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                          p === page ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-tggray-100"
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
