import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";
import { ImageManager } from "@/components/admin/ImageManager";
import { VariantManager } from "@/components/admin/VariantManager";
import { deactivateProductAction, activateProductAction } from "../actions";

export default async function EditProductPage({ params }: PageProps<"/admin/produtos/[id]">) {
  const { id } = await params;

  const [product, brands, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { orderBy: { size: "asc" } },
        categories: true,
      },
    }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/produtos" className="text-xs font-semibold text-blue-600">← Produtos</Link>
          <h1 className="mt-1 text-xl font-extrabold text-navy-900">{product.name}</h1>
        </div>
        <form action={product.status === "ACTIVE" ? deactivateProductAction.bind(null, product.id) : activateProductAction.bind(null, product.id)}>
          <button className={`rounded-full px-4 py-2 text-xs font-bold ${product.status === "ACTIVE" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
            {product.status === "ACTIVE" ? "Desativar produto" : "Ativar produto"}
          </button>
        </form>
      </div>

      <ImageManager
        productId={product.id}
        images={product.images.map((i) => ({ id: i.id, url: i.url, thumbUrl: i.thumbUrl, isMain: i.isMain }))}
      />

      <VariantManager productId={product.id} variants={product.variants} />

      <ProductForm
        mode="edit"
        productId={product.id}
        brands={brands}
        categories={categories}
        initial={{
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          brandId: product.brandId,
          shortDescription: product.shortDescription,
          description: product.description,
          costPriceCents: product.costPriceCents,
          priceCents: product.priceCents,
          compareAtCents: product.compareAtCents,
          pixDiscountPercent: product.pixDiscountPercent,
          gender: product.gender,
          isFeatured: product.isFeatured,
          isOnSale: product.isOnSale,
          isNew: product.isNew,
          status: product.status,
          metaTitle: product.metaTitle,
          metaDescription: product.metaDescription,
          categoryIds: product.categories.map((c) => c.categoryId),
        }}
      />
    </div>
  );
}
