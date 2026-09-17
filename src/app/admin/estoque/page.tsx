import { prisma } from "@/lib/db";
import { StockRow } from "@/components/admin/StockRow";

export default async function StockPage({ searchParams }: PageProps<"/admin/estoque">) {
  const sp = (await searchParams) as Record<string, string | undefined>;
  const filter = sp.filtro;

  const variants = await prisma.productVariant.findMany({
    where: filter === "baixo" ? { stock: { gt: 0, lte: 5 } } : filter === "zerado" ? { stock: 0 } : undefined,
    include: { product: { select: { name: true } } },
    orderBy: { stock: "asc" },
    take: 300,
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-navy-900">Estoque</h1>

      <div className="flex gap-2">
        {[
          { href: "/admin/estoque", value: undefined, label: "Todos" },
          { href: "/admin/estoque?filtro=baixo", value: "baixo", label: "Estoque baixo" },
          { href: "/admin/estoque?filtro=zerado", value: "zerado", label: "Sem estoque" },
        ].map((f) => (
          <a
            key={f.href}
            href={f.href}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${
              filter === f.value ? "border-navy-900 bg-navy-900 text-white" : "border-tggray-200 text-navy-800"
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-tggray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-tggray-50 text-left text-xs font-semibold uppercase text-tggray-500">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Tamanho</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Estoque</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tggray-100">
            {variants.map((v) => (
              <StockRow key={v.id} variantId={v.id} productName={v.product.name} size={v.size} sku={v.sku} stock={v.stock} />
            ))}
            {variants.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-tggray-500">Nenhum item encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
