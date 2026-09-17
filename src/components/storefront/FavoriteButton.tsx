"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tg_favoritos";

function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event("tg-favorites-changed"));
  } catch {
    // localStorage indisponível (modo privado, etc.) — falha silenciosa
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>(() => (typeof window !== "undefined" ? readFavorites() : []));

  useEffect(() => {
    const handler = () => setIds(readFavorites());
    window.addEventListener("tg-favorites-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("tg-favorites-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return ids;
}

export function FavoriteButton({ productId, className = "" }: { productId: string; className?: string }) {
  const favorites = useFavorites();
  const active = favorites.includes(productId);

  return (
    <button
      type="button"
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const current = readFavorites();
        const next = active ? current.filter((id) => id !== productId) : [...current, productId];
        writeFavorites(next);
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 transition hover:scale-105 ${className}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={active ? "#e0293e" : "none"}
        stroke={active ? "#e0293e" : "#232a3b"}
        strokeWidth="2"
      >
        <path d="M12 21s-7.5-4.35-10-9.14C.5 8.5 2.5 4 6.5 4c2 0 3.5 1.2 5.5 3.5C14 5.2 15.5 4 17.5 4c4 0 6 4.5 4.5 7.86C19.5 16.65 12 21 12 21z" />
      </svg>
    </button>
  );
}
