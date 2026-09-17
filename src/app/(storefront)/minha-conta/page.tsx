import Link from "next/link";
import { getCurrentCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logoutCustomerAction } from "./actions";

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const orderCount = await prisma.order.count({ where: { customerId: customer.id } });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Olá, {customer.name.split(" ")[0]}</h1>
          <p className="text-sm text-tggray-600">{customer.email}</p>
        </div>
        <form action={logoutCustomerAction}>
          <button className="text-sm font-semibold text-red-600">Sair</button>
        </form>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/minha-conta/pedidos" className="rounded-2xl border border-tggray-200 p-5 hover:border-blue-300">
          <p className="text-sm font-semibold text-navy-900">Meus pedidos</p>
          <p className="mt-1 text-xs text-tggray-600">{orderCount} pedido(s) realizado(s)</p>
        </Link>
        <Link href="/produtos" className="rounded-2xl border border-tggray-200 p-5 hover:border-blue-300">
          <p className="text-sm font-semibold text-navy-900">Continuar comprando</p>
          <p className="mt-1 text-xs text-tggray-600">Explore o catálogo completo</p>
        </Link>
      </div>
    </div>
  );
}
