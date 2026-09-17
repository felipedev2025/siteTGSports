import { prisma } from "@/lib/db";
import { QuickCreateCategory } from "@/components/admin/QuickCreateCategory";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";
import { toggleCategoryActiveAction } from "./actions";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { parent: true, _count: { select: { products: true } } },
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-navy-900">Categorias</h1>
      <QuickCreateCategory parents={categories.filter((c) => !c.parentId)} />

      <div className="overflow-hidden rounded-2xl border border-tggray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-tggray-50 text-left text-xs font-semibold uppercase text-tggray-500">
            <tr>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Categoria pai</th>
              <th className="px-4 py-3">Produtos</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tggray-100">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-navy-900">{c.name}</td>
                <td className="px-4 py-3 text-tggray-700">{c.parent?.name ?? "—"}</td>
                <td className="px-4 py-3 text-tggray-700">{c._count.products}</td>
                <td className="px-4 py-3">
                  <ToggleActiveButton active={c.active} action={toggleCategoryActiveAction.bind(null, c.id)} />
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-tggray-500">Nenhuma categoria cadastrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
