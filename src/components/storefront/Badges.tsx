export function ProductBadges({
  isNew,
  isOnSale,
  lowStock,
}: {
  isNew?: boolean;
  isOnSale?: boolean;
  lowStock?: boolean;
}) {
  if (!isNew && !isOnSale && !lowStock) return null;
  return (
    <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5">
      {isNew && (
        <span className="rounded-full bg-navy-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          Novo
        </span>
      )}
      {isOnSale && (
        <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          Oferta
        </span>
      )}
      {lowStock && (
        <span className="rounded-full bg-tggray-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          Últimas unidades
        </span>
      )}
    </div>
  );
}
