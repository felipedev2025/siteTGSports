import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { centsToBRL } from "@/lib/money";
import { maskCpf } from "@/lib/mask";
import { requireUser } from "@/lib/auth/session";

export default async function AdminCustomerDetailPage({ params }: PageProps<"/admin/clientes/[id]">) {
  const { id } = await params;
  const user = await requireUser();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: { orderBy: { createdAt: "desc" }, include: { payments: true } },
    },
  });
  if (!customer) notFound();

  const canSeeFullCpf = user.role === "ADMIN";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/clientes" className="text-xs font-semibold text-blue-600">← Clientes</Link>
        <h1 className="mt-1 text-xl font-extrabold text-navy-900">{customer.name}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-tggray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-navy-900">Dados</h2>
          <p className="text-sm text-tggray-700">{customer.email}</p>
          <p className="text-sm text-tggray-700">{customer.phone ?? "—"}</p>
          <p className="text-sm text-tggray-700">
            CPF: {customer.cpf ? (canSeeFullCpf ? customer.cpf : maskCpf(customer.cpf)) : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-tggray-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold text-navy-900">Endereços</h2>
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-tggray-500">Nenhum endereço cadastrado.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {customer.addresses.map((a) => (
                <p key={a.id} className="text-sm text-tggray-700">
                  {a.street}, {a.number} — {a.district}, {a.city}/{a.state} · CEP {a.cep}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-tggray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-bold text-navy-900">Pedidos</h2>
        <div className="divide-y divide-tggray-100">
          {customer.orders.map((o) => (
            <Link key={o.id} href={`/admin/pedidos/${o.id}`} className="flex items-center justify-between py-2.5 text-sm hover:text-blue-600">
              <span>{o.orderNumber} · {o.createdAt.toLocaleDateString("pt-BR")}</span>
              <span className="font-semibold text-navy-900">{centsToBRL(o.totalCents)}</span>
            </Link>
          ))}
          {customer.orders.length === 0 && <p className="text-sm text-tggray-500">Nenhum pedido ainda.</p>}
        </div>
      </div>
    </div>
  );
}
