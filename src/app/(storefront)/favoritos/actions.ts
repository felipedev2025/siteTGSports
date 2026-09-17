"use server";

import { prisma } from "@/lib/db";

export async function getFavoriteProductsAction(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.product.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    include: {
      brand: true,
      images: { orderBy: { position: "asc" }, take: 2 },
      variants: { select: { id: true, size: true, stock: true, active: true } },
    },
  });
}
