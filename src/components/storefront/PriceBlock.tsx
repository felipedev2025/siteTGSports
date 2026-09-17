import { applyPixDiscount, centsToBRL, discountPercentBetween, installmentOf } from "@/lib/money";

interface PriceBlockProps {
  priceCents: number;
  compareAtCents?: number | null;
  pixDiscountPercent?: number;
  size?: "sm" | "lg";
}

export function PriceBlock({ priceCents, compareAtCents, pixDiscountPercent = 0, size = "sm" }: PriceBlockProps) {
  const hasDiscount = !!compareAtCents && compareAtCents > priceCents;
  const discountPercent = hasDiscount ? discountPercentBetween(compareAtCents!, priceCents) : 0;
  const pixPrice = applyPixDiscount(priceCents, pixDiscountPercent);
  const installment = installmentOf(priceCents, 6);
  const big = size === "lg";

  return (
    <div className="flex flex-col gap-0.5">
      {hasDiscount && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-tggray-400 line-through">{centsToBRL(compareAtCents!)}</span>
          <span className="text-[11px] font-bold text-white bg-red-600 rounded px-1.5 py-0.5 leading-none">
            -{discountPercent}%
          </span>
        </div>
      )}
      <span className={`font-bold text-navy-900 ${big ? "text-3xl" : "text-lg"}`}>{centsToBRL(priceCents)}</span>
      {pixDiscountPercent > 0 ? (
        <span className={`font-medium text-green-600 ${big ? "text-sm" : "text-xs"}`}>
          {centsToBRL(pixPrice)} no PIX ({pixDiscountPercent}% off)
        </span>
      ) : (
        <span className={`text-tggray-600 ${big ? "text-sm" : "text-xs"}`}>
          ou {installment.count}x de {centsToBRL(installment.valueCents)} sem juros
        </span>
      )}
    </div>
  );
}
