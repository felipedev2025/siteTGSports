import { prisma } from "@/lib/db";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-navy-900">Auditoria</h1>
      <p className="-mt-3 text-sm text-tggray-600">Registro de ações administrativas: preços, estoque, pedidos, cupons e mais.</p>

      <div className="overflow-hidden rounded-2xl border border-tggray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-tggray-50 text-left text-xs font-semibold uppercase text-tggray-500">
            <tr>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Entidade</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tggray-100">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-navy-900">{l.user?.name ?? "Sistema"}</td>
                <td className="px-4 py-3 font-mono text-xs text-tggray-700">{l.action}</td>
                <td className="px-4 py-3 text-tggray-700">{l.entityType} {l.entityId ? `#${l.entityId.slice(0, 8)}` : ""}</td>
                <td className="px-4 py-3 text-tggray-500">{l.ip ?? "—"}</td>
                <td className="px-4 py-3 text-tggray-600">{l.createdAt.toLocaleString("pt-BR")}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-tggray-500">Nenhum registro ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
