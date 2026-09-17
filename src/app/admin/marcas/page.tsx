import Image from "next/image";
import { prisma } from "@/lib/db";
import { QuickCreateBrand } from "@/components/admin/QuickCreateBrand";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";
import { toggleBrandActiveAction } from "./actions";

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-navy-900">Marcas</h1>
      <QuickCreateBrand />

      <div className="overflow-hidden rounded-2xl border border-tggray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-tggray-50 text-left text-xs font-semibold uppercase text-tggray-500">
            <tr>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Produtos</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tggray-100">
            {brands.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {b.logoUrl && (
                      <div className="relative h-8 w-8 overflow-hidden rounded bg-tggray-100">
                        <Image src={b.logoUrl} alt={b.name} fill className="object-contain" />
                      </div>
                    )}
                    <span className="font-medium text-navy-900">{b.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-tggray-700">{b._count.products}</td>
                <td className="px-4 py-3">
                  <ToggleActiveButton active={b.active} action={toggleBrandActiveAction.bind(null, b.id)} />
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-tggray-500">Nenhuma marca cadastrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
