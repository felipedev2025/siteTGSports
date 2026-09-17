"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { storage, ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage/storage";

export interface ActionState {
  success: boolean;
  message?: string;
}

export async function createBrandAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { success: false, message: "Informe o nome da marca." };

  const slug = slugify(name);
  const exists = await prisma.brand.findUnique({ where: { slug } });
  if (exists) return { success: false, message: "Já existe uma marca com este nome." };

  const brand = await prisma.brand.create({ data: { name, slug } });

  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(logo.type)) return { success: false, message: "Tipo de imagem inválido." };
    if (logo.size > MAX_UPLOAD_SIZE_BYTES) return { success: false, message: "Logo muito grande." };
    const buffer = Buffer.from(await logo.arrayBuffer());
    const saved = await storage.saveImage(buffer, logo.name, `brands/${brand.id}`);
    await prisma.brand.update({ where: { id: brand.id }, data: { logoUrl: saved.main.url } });
  }

  await recordAudit({ userId: user.id, action: "CREATE", entityType: "Brand", entityId: brand.id, after: { name } });
  revalidatePath("/admin/marcas");
  return { success: true };
}

export async function toggleBrandActiveAction(id: string) {
  const user = await requireUser();
  const brand = await prisma.brand.findUniqueOrThrow({ where: { id } });
  await prisma.brand.update({ where: { id }, data: { active: !brand.active } });
  await recordAudit({ userId: user.id, action: "TOGGLE_ACTIVE", entityType: "Brand", entityId: id });
  revalidatePath("/admin/marcas");
}
