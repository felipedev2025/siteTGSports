"use client";

import { useFavorites } from "./FavoriteButton";

export function FavoritesCount() {
  const favorites = useFavorites();
  if (favorites.length === 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
      {favorites.length}
    </span>
  );
}
