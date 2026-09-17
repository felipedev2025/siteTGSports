import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
  });

  const staticRoutes = [
    "",
    "/produtos",
    "/sobre",
    "/contato",
    "/trocas-e-devolucoes",
    "/politica-de-privacidade",
    "/termos-de-uso",
    "/politica-de-entrega",
    "/perguntas-frequentes",
  ].map((path) => ({
    url: `${appUrl}${path}`,
    lastModified: new Date(),
  }));

  const productRoutes = products.map((p) => ({
    url: `${appUrl}/produto/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  return [...staticRoutes, ...productRoutes];
}
