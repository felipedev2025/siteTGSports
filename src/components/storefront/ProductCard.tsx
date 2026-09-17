import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { PriceBlock } from "./PriceBlock";
import { ProductBadges } from "./Badges";
import { FavoriteButton } from "./FavoriteButton";

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const totalStock = product.variants.reduce((sum, v) => sum + (v.active ? v.stock : 0), 0);
  const lowStock = totalStock > 0 && totalStock <= 3;
  const outOfStock = totalStock === 0;

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-tggray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy-900/5"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-tggray-50">
        <ProductBadges isNew={product.isNew} isOnSale={product.isOnSale} lowStock={lowStock} />
        <FavoriteButton productId={product.id} className="absolute right-2 top-2 z-10" />
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-tggray-400 text-sm">Sem foto</div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-tggray-800 px-3 py-1 text-xs font-bold uppercase text-white">
              Esgotado
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        {product.brand && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">{product.brand.name}</span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-navy-900">{product.name}</h3>
        <div className="mt-1">
          <PriceBlock
            priceCents={product.priceCents}
            compareAtCents={product.compareAtCents}
            pixDiscountPercent={product.pixDiscountPercent}
          />
        </div>
      </div>
    </Link>
  );
}
