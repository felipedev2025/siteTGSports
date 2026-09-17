"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";

export interface ActionState {
  success: boolean;
  message?: string;
}

export async function createCategoryAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const parentId = String(formData.get("parentId") ?? "") || null;
  if (!name) return { success: false, message: "Informe o nome da categoria." };

  const slug = slugify(name);
  const exists = await prisma.category.findUnique({ where: { slug } });
  if (exists) return { success: false, message: "Já existe uma categoria com este nome." };

  const count = await prisma.category.count();
  const category = await prisma.category.create({ data: { name, slug, parentId, position: count } });

  await recordAudit({ userId: user.id, action: "CREATE", entityType: "Category", entityId: category.id, after: { name } });
  revalidatePath("/admin/categorias");
  return { success: true };
}

export async function toggleCategoryActiveAction(id: string) {
  const user = await requireUser();
  const category = await prisma.category.findUniqueOrThrow({ where: { id } });
  await prisma.category.update({ where: { id }, data: { active: !category.active } });
  await recordAudit({ userId: user.id, action: "TOGGLE_ACTIVE", entityType: "Category", entityId: id });
  revalidatePath("/admin/categorias");
}
