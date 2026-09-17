import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

export function ProductRail({
  title,
  subtitle,
  products,
  viewAllHref,
}: {
  title: string;
  subtitle?: string;
  products: ProductCardData[];
  viewAllHref?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-tggray-600">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700">
            Ver tudo →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
