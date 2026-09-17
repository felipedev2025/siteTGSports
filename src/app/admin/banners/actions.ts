"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { storage, ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage/storage";

export interface ActionState {
  success: boolean;
  message?: string;
}

export async function createBannerAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim() || undefined;
  const link = String(formData.get("link") ?? "").trim() || undefined;
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim() || undefined;
  const image = formData.get("image");

  if (!title) return { success: false, message: "Informe o título do banner." };
  if (!(image instanceof File) || image.size === 0) return { success: false, message: "Selecione uma imagem para o banner." };
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(image.type)) return { success: false, message: "Tipo de imagem inválido." };
  if (image.size > MAX_UPLOAD_SIZE_BYTES) return { success: false, message: "Imagem muito grande." };

  const buffer = Buffer.from(await image.arrayBuffer());
  const saved = await storage.saveImage(buffer, image.name, "banners");

  const count = await prisma.banner.count();
  const banner = await prisma.banner.create({
    data: { title, subtitle, link, ctaLabel, imageUrl: saved.main.url, position: count },
  });

  await recordAudit({ userId: user.id, action: "CREATE", entityType: "Banner", entityId: banner.id, after: { title } });
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true };
}

export async function toggleBannerActiveAction(id: string) {
  const user = await requireUser();
  const banner = await prisma.banner.findUniqueOrThrow({ where: { id } });
  await prisma.banner.update({ where: { id }, data: { active: !banner.active } });
  await recordAudit({ userId: user.id, action: "TOGGLE_ACTIVE", entityType: "Banner", entityId: id });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export async function deleteBannerAction(id: string) {
  const user = await requireUser();
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) return;
  await prisma.banner.delete({ where: { id } });
  await storage.delete(banner.imageUrl.replace("/api/media/", ""));
  await recordAudit({ userId: user.id, action: "DELETE", entityType: "Banner", entityId: id });
  revalidatePath("/admin/banners");
  revalidatePath("/");
}
