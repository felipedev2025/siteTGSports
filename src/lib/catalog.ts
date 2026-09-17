import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
export { SIZES } from "@/lib/constants";

export interface CatalogFilters {
  q?: string;
  brand?: string; // slug
  category?: string; // slug
  gender?: string;
  size?: string;
  onSale?: boolean;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: "recentes" | "menor-preco" | "maior-preco" | "maior-desconto";
  page?: number;
  perPage?: number;
}

const productCardInclude = {
  brand: true,
  images: { orderBy: { position: "asc" as const }, take: 2 },
  variants: { select: { id: true, size: true, stock: true, active: true } },
};

export type ProductCardData = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export async function listProducts(filters: CatalogFilters) {
  const page = Math.max(filters.page ?? 1, 1);
  const perPage = Math.min(filters.perPage ?? 24, 60);

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
  };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { brand: { name: { contains: filters.q, mode: "insensitive" } } },
      { sku: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.brand) where.brand = { slug: filters.brand };
  if (filters.category) where.categories = { some: { category: { slug: filters.category } } };
  if (filters.gender) where.gender = filters.gender;
  if (filters.onSale) where.isOnSale = true;
  if (filters.size) where.variants = { some: { size: filters.size, active: true, stock: { gt: 0 } } };
  if (filters.minPriceCents !== undefined || filters.maxPriceCents !== undefined) {
    where.priceCents = {
      ...(filters.minPriceCents !== undefined ? { gte: filters.minPriceCents } : {}),
      ...(filters.maxPriceCents !== undefined ? { lte: filters.maxPriceCents } : {}),
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "menor-preco"
      ? { priceCents: "asc" }
      : filters.sort === "maior-preco"
        ? { priceCents: "desc" }
        : { createdAt: "desc" };
  // "maior-desconto" e "recentes" tratados via createdAt/compareAt abaixo

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  if (filters.sort === "maior-desconto") {
    items.sort((a, b) => {
      const da = a.compareAtCents ? a.compareAtCents - a.priceCents : 0;
      const db = b.compareAtCents ? b.compareAtCents - b.priceCents : 0;
      return db - da;
    });
  }

  return { items, total, page, perPage, pageCount: Math.max(Math.ceil(total / perPage), 1) };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      brand: true,
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { size: "asc" }, where: { active: true } },
      categories: { include: { category: true } },
    },
  });
}

export async function getRelatedProducts(productId: string, categoryIds: string[], brandId: string | null) {
  return prisma.product.findMany({
    where: {
      id: { not: productId },
      status: "ACTIVE",
      OR: [
        categoryIds.length ? { categories: { some: { categoryId: { in: categoryIds } } } } : undefined,
        brandId ? { brandId } : undefined,
      ].filter(Boolean) as Prisma.ProductWhereInput[],
    },
    include: productCardInclude,
    take: 8,
  });
}

export async function getHomeSections() {
  const [featured, onSale, newest, brands, categories] = await Promise.all([
    prisma.product.findMany({ where: { status: "ACTIVE", isFeatured: true }, include: productCardInclude, take: 8, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", isOnSale: true }, include: productCardInclude, take: 8, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", isNew: true }, include: productCardInclude, take: 8, orderBy: { createdAt: "desc" } }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { active: true, parentId: null }, orderBy: { position: "asc" } }),
  ]);
  return { featured, onSale, newest, brands, categories };
}
