"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

export interface ActionState {
  success: boolean;
  message?: string;
}

export async function createCouponAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "PERCENT") as "PERCENT" | "FIXED";
  const valueRaw = Number(formData.get("value") ?? 0);
  const minPurchase = formData.get("minPurchase") ? Number(formData.get("minPurchase")) : null;
  const maxUses = formData.get("maxUses") ? Number(formData.get("maxUses")) : null;
  const expiresAt = formData.get("expiresAt") ? new Date(String(formData.get("expiresAt"))) : null;

  if (!code) return { success: false, message: "Informe o código do cupom." };
  if (valueRaw <= 0) return { success: false, message: "Informe um valor válido." };

  const exists = await prisma.coupon.findUnique({ where: { code } });
  if (exists) return { success: false, message: "Já existe um cupom com este código." };

  const value = type === "PERCENT" ? Math.min(Math.round(valueRaw), 100) : Math.round(valueRaw * 100);

  const coupon = await prisma.coupon.create({
    data: {
      code,
      type,
      value,
      minPurchaseCents: minPurchase ? Math.round(minPurchase * 100) : null,
      maxUses,
      expiresAt,
    },
  });

  await recordAudit({ userId: user.id, action: "CREATE", entityType: "Coupon", entityId: coupon.id, after: { code, type, value } });
  revalidatePath("/admin/cupons");
  return { success: true };
}

export async function toggleCouponActiveAction(id: string) {
  const user = await requireUser();
  const coupon = await prisma.coupon.findUniqueOrThrow({ where: { id } });
  await prisma.coupon.update({ where: { id }, data: { active: !coupon.active } });
  await recordAudit({ userId: user.id, action: "TOGGLE_ACTIVE", entityType: "Coupon", entityId: id });
  revalidatePath("/admin/cupons");
}
