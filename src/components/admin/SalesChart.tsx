import { centsToBRL } from "@/lib/money";

export function SalesChart({ data }: { data: { date: string; totalCents: number }[] }) {
  const max = Math.max(...data.map((d) => d.totalCents), 1);

  return (
    <div className="rounded-2xl border border-tggray-200 bg-white p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-tggray-500">Vendas pagas — últimos 7 dias</p>
      <div className="flex h-40 items-end gap-3">
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-32 w-full items-end">
              <div
                className="w-full rounded-t-md bg-blue-500 transition-all"
                style={{ height: `${Math.max((d.totalCents / max) * 100, d.totalCents > 0 ? 4 : 0)}%` }}
                title={centsToBRL(d.totalCents)}
              />
            </div>
            <span className="text-[10px] font-medium uppercase text-tggray-500">{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
