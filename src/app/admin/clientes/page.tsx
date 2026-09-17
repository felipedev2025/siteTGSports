import Link from "next/link";
import { prisma } from "@/lib/db";
import { centsToBRL } from "@/lib/money";
import { maskCpf } from "@/lib/mask";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      orders: { select: { totalCents: true, paymentStatus: true, createdAt: true } },
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-navy-900">Clientes</h1>

      <div className="overflow-hidden rounded-2xl border border-tggray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-tggray-50 text-left text-xs font-semibold uppercase text-tggray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Pedidos</th>
              <th className="px-4 py-3">Total comprado</th>
              <th className="px-4 py-3">Último pedido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tggray-100">
            {customers.map((c) => {
              const paidOrders = c.orders.filter((o) => o.paymentStatus === "PAID");
              const total = paidOrders.reduce((s, o) => s + o.totalCents, 0);
              const last = c.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
              return (
                <tr key={c.id} className="hover:bg-tggray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clientes/${c.id}`} className="font-semibold text-blue-600">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-tggray-700">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-tggray-700">{c.email}</td>
                  <td className="px-4 py-3 text-tggray-700">{c.cpf ? maskCpf(c.cpf) : "—"}</td>
                  <td className="px-4 py-3 text-tggray-700">{c.orders.length}</td>
                  <td className="px-4 py-3 font-semibold text-navy-900">{centsToBRL(total)}</td>
                  <td className="px-4 py-3 text-tggray-600">{last ? last.createdAt.toLocaleDateString("pt-BR") : "—"}</td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-tggray-500">Nenhum cliente cadastrado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
