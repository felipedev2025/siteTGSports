"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";

export interface ActionState {
  success: boolean;
  message?: string;
}

export async function updateSettingsAction(formData: FormData): Promise<ActionState> {
  const user = await requireAdmin();

  const fixedShipping = Number(formData.get("fixedShipping") ?? 0);
  const freeShippingAbove = formData.get("freeShippingAbove") ? Number(formData.get("freeShippingAbove")) : null;

  const data = {
    storeName: String(formData.get("storeName") ?? "TG Sports"),
    storeCep: String(formData.get("storeCep") ?? "") || null,
    pickupEnabled: formData.get("pickupEnabled") === "on",
    pickupInstructions: String(formData.get("pickupInstructions") ?? "") || null,
    fixedShippingCents: Math.round(fixedShipping * 100),
    freeShippingAboveCents: freeShippingAbove ? Math.round(freeShippingAbove * 100) : null,
    extraDeliveryDays: Number(formData.get("extraDeliveryDays") ?? 0),
    whatsappNumber: String(formData.get("whatsappNumber") ?? "") || null,
    instagramUrl: String(formData.get("instagramUrl") ?? "") || null,
    contactEmail: String(formData.get("contactEmail") ?? "") || null,
    contactPhone: String(formData.get("contactPhone") ?? "") || null,
    addressLine: String(formData.get("addressLine") ?? "") || null,
    aboutContent: String(formData.get("aboutContent") ?? "") || null,
    exchangePolicy: String(formData.get("exchangePolicy") ?? "") || null,
    privacyPolicy: String(formData.get("privacyPolicy") ?? "") || null,
    termsOfUse: String(formData.get("termsOfUse") ?? "") || null,
    deliveryPolicy: String(formData.get("deliveryPolicy") ?? "") || null,
    faqContent: String(formData.get("faqContent") ?? "") || null,
  };

  await prisma.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  await recordAudit({ userId: user.id, action: "UPDATE", entityType: "Settings", entityId: "1" });

  revalidatePath("/", "layout");
  return { success: true, message: "Configurações salvas com sucesso." };
}
