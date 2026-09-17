export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "warning" | "danger" }) {
  const toneClass =
    tone === "warning" ? "text-amber-600" : tone === "danger" ? "text-red-600" : "text-navy-900";
  return (
    <div className="rounded-2xl border border-tggray-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-tggray-500">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-tggray-500">{hint}</p>}
    </div>
  );
}
