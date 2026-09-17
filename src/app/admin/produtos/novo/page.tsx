import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-navy-900">Novo produto</h1>
      <p className="-mt-3 text-sm text-tggray-600">
        Depois de criar o produto, você poderá adicionar fotos e numerações/estoque na tela de edição.
      </p>
      <ProductForm mode="create" brands={brands} categories={categories} />
    </div>
  );
}
