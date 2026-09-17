import type { Metadata } from "next";
import Link from "next/link";
import { getHomeSections } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { Hero } from "@/components/storefront/Hero";
import { CategoryTiles } from "@/components/storefront/CategoryTiles";
import { ProductRail } from "@/components/storefront/ProductRail";
import { BannerStrip } from "@/components/storefront/BannerStrip";

export const metadata: Metadata = {
  title: "TG Sports — Tênis e calçados esportivos originais",
};

export default async function HomePage() {
  const { featured, onSale, newest, brands, categories } = await getHomeSections();
  const banners = await prisma.banner.findMany({
    where: { active: true, OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] },
    orderBy: { position: "asc" },
  });

  return (
    <div>
      <Hero />

      <BannerStrip banners={banners} />

      <CategoryTiles categories={categories} />

      <ProductRail title="Novidades" subtitle="Acabou de chegar" products={newest} viewAllHref="/produtos?novidades=1" />
      <ProductRail title="Mais vendidos" subtitle="Os queridinhos do time" products={featured} viewAllHref="/produtos" />

      {onSale.length > 0 && (
        <section className="bg-tggray-50 py-2">
          <ProductRail title="Ofertas" subtitle="Aproveite enquanto durar o estoque" products={onSale} viewAllHref="/produtos?oferta=1" />
        </section>
      )}

      {brands.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <h2 className="mb-5 text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">Marcas</h2>
          <div className="flex flex-wrap gap-3">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/produtos?marca=${brand.slug}`}
                className="rounded-full border border-tggray-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-800 transition hover:border-blue-300 hover:text-blue-600"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 to-blue-700 px-8 py-12 text-center sm:py-16">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Ainda não encontrou o seu tênis ideal?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-blue-100">
            Explore todo o nosso catálogo com filtros por marca, numeração e categoria.
          </p>
          <Link
            href="/produtos"
            className="mt-6 inline-block rounded-full bg-white px-7 py-3 text-sm font-bold text-navy-900 transition hover:bg-blue-50"
          >
            Ver catálogo completo
          </Link>
        </div>
      </section>
    </div>
  );
}
