"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFavorites } from "@/components/storefront/FavoriteButton";
import { ProductCard } from "@/components/storefront/ProductCard";
import { getFavoriteProductsAction } from "./actions";
import type { ProductCardData } from "@/lib/catalog";

export default function FavoritesPage() {
  const favorites = useFavorites();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);

  useEffect(() => {
    getFavoriteProductsAction(favorites).then(setProducts);
  }, [favorites]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-navy-900">Meus favoritos</h1>

      {products === null ? (
        <p className="text-sm text-tggray-600">Carregando...</p>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-sm text-tggray-600">Você ainda não favoritou nenhum produto.</p>
          <Link href="/produtos" className="mt-4 text-sm font-semibold text-blue-600">
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
