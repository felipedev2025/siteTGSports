import Link from "next/link";
import type { Category } from "@prisma/client";

export function CategoryTiles({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h2 className="mb-5 text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">Categorias</h2>
      <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/produtos?categoria=${category.slug}`}
            className="flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-tggray-200 bg-white px-5 py-4 text-center transition hover:border-blue-300 hover:shadow-md sm:shrink"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 16.5V9.75L12 4l8 5.75V16.5L12 21l-8-4.5Z" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-navy-800 whitespace-nowrap">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
