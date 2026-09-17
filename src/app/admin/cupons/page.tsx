import { prisma } from "@/lib/db";
import { QuickCreateCoupon } from "@/components/admin/QuickCreateCoupon";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";
import { toggleCouponActiveAction } from "./actions";

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-navy-900">Cupons</h1>
      <QuickCreateCoupon />

      <div className="overflow-hidden rounded-2xl border border-tggray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-tggray-50 text-left text-xs font-semibold uppercase text-tggray-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Desconto</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Validade</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tggray-100">
            {coupons.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-mono font-semibold text-navy-900">{c.code}</td>
                <td className="px-4 py-3 text-tggray-700">{c.type === "PERCENT" ? `${c.value}%` : `R$ ${(c.value / 100).toFixed(2)}`}</td>
                <td className="px-4 py-3 text-tggray-700">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                <td className="px-4 py-3 text-tggray-700">{c.expiresAt ? c.expiresAt.toLocaleDateString("pt-BR") : "Sem validade"}</td>
                <td className="px-4 py-3">
                  <ToggleActiveButton active={c.active} action={toggleCouponActiveAction.bind(null, c.id)} />
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-tggray-500">Nenhum cupom cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
