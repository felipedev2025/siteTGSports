import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { centsToBRL } from "@/lib/money";

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/produtos">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const q = sp.q;

  const products = await prisma.product.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : undefined,
    include: {
      brand: true,
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: { select: { stock: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-navy-900">Produtos</h1>
        <Link href="/admin/produtos/novo" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white">
          + Novo produto
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou SKU..."
          className="w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm"
        />
      </form>

      <div className="overflow-hidden rounded-2xl border border-tggray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-tggray-50 text-left text-xs font-semibold uppercase text-tggray-500">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-tggray-100">
            {products.map((p) => {
              const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id} className="hover:bg-tggray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-tggray-100">
                        {p.images[0] && <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />}
                      </div>
                      <div>
                        <p className="font-medium text-navy-900">{p.name}</p>
                        <p className="text-xs text-tggray-500">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-tggray-700">{p.brand?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-tggray-700">{centsToBRL(p.priceCents)}</td>
                  <td className={`px-4 py-3 font-medium ${totalStock === 0 ? "text-red-600" : totalStock <= 5 ? "text-amber-600" : "text-tggray-700"}`}>
                    {totalStock} un.
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === "ACTIVE" ? "bg-green-50 text-green-600" : "bg-tggray-100 text-tggray-500"}`}>
                      {p.status === "ACTIVE" ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/produtos/${p.id}`} className="text-xs font-semibold text-blue-600">
                      Editar
                    </Link>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-tggray-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
