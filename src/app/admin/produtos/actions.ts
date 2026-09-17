"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { productFormSchema } from "@/lib/validation/product";
import { slugify } from "@/lib/slug";
import { recordAudit } from "@/lib/audit";
import { storage, ALLOWED_IMAGE_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from "@/lib/storage/storage";

export interface ActionState {
  success: boolean;
  message?: string;
}

function parseProductForm(formData: FormData) {
  return productFormSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    sku: formData.get("sku"),
    brandId: formData.get("brandId") || undefined,
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description") || undefined,
    costPriceCents: formData.get("costPriceCents") || undefined,
    priceCents: formData.get("priceCents"),
    compareAtCents: formData.get("compareAtCents") || undefined,
    pixDiscountPercent: formData.get("pixDiscountPercent") || 0,
    gender: formData.get("gender") || undefined,
    isFeatured: formData.get("isFeatured") === "on",
    isOnSale: formData.get("isOnSale") === "on",
    isNew: formData.get("isNew") === "on",
    status: formData.get("status") || "ACTIVE",
    metaTitle: formData.get("metaTitle") || undefined,
    metaDescription: formData.get("metaDescription") || undefined,
    categoryIds: formData.getAll("categoryIds").map(String),
  });
}

export async function createProductAction(formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  let data;
  try {
    data = parseProductForm(formData);
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Dados inválidos" };
  }

  const slug = slugify(data.slug || data.name);

  const existingSlug = await prisma.product.findUnique({ where: { slug } });
  if (existingSlug) return { success: false, message: "Já existe um produto com este slug/nome." };

  const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existingSku) return { success: false, message: "Já existe um produto com este SKU." };

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      sku: data.sku,
      brandId: data.brandId || null,
      shortDescription: data.shortDescription,
      description: data.description,
      costPriceCents: data.costPriceCents,
      priceCents: data.priceCents,
      compareAtCents: data.compareAtCents || null,
      pixDiscountPercent: data.pixDiscountPercent,
      gender: data.gender,
      isFeatured: data.isFeatured,
      isOnSale: data.isOnSale,
      isNew: data.isNew,
      status: data.status,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) },
    },
  });

  await recordAudit({ userId: user.id, action: "CREATE", entityType: "Product", entityId: product.id, after: data });
  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${product.id}`);
}

export async function updateProductAction(productId: string, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  let data;
  try {
    data = parseProductForm(formData);
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : "Dados inválidos" };
  }

  const before = await prisma.product.findUnique({ where: { id: productId } });
  if (!before) return { success: false, message: "Produto não encontrado" };

  const slug = slugify(data.slug || data.name);
  const slugTaken = await prisma.product.findFirst({ where: { slug, NOT: { id: productId } } });
  if (slugTaken) return { success: false, message: "Já existe outro produto com este slug." };

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        slug,
        sku: data.sku,
        brandId: data.brandId || null,
        shortDescription: data.shortDescription,
        description: data.description,
        costPriceCents: data.costPriceCents,
        priceCents: data.priceCents,
        compareAtCents: data.compareAtCents || null,
        pixDiscountPercent: data.pixDiscountPercent,
        gender: data.gender,
        isFeatured: data.isFeatured,
        isOnSale: data.isOnSale,
        isNew: data.isNew,
        status: data.status,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
    }),
    prisma.productCategory.deleteMany({ where: { productId } }),
    ...(data.categoryIds.length
      ? [prisma.productCategory.createMany({ data: data.categoryIds.map((categoryId) => ({ productId, categoryId })) })]
      : []),
  ]);

  const priceChanged = before.priceCents !== data.priceCents;
  await recordAudit({
    userId: user.id,
    action: priceChanged ? "UPDATE_PRICE" : "UPDATE",
    entityType: "Product",
    entityId: productId,
    before: { priceCents: before.priceCents, status: before.status },
    after: { priceCents: data.priceCents, status: data.status },
  });

  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${productId}`);
  return { success: true, message: "Produto atualizado com sucesso." };
}

export async function deactivateProductAction(productId: string) {
  const user = await requireUser();
  await prisma.product.update({ where: { id: productId }, data: { status: "INACTIVE" } });
  await recordAudit({ userId: user.id, action: "DEACTIVATE", entityType: "Product", entityId: productId });
  revalidatePath("/admin/produtos");
}

export async function activateProductAction(productId: string) {
  const user = await requireUser();
  await prisma.product.update({ where: { id: productId }, data: { status: "ACTIVE" } });
  await recordAudit({ userId: user.id, action: "ACTIVATE", entityType: "Product", entityId: productId });
  revalidatePath("/admin/produtos");
}

// ---------------------------------------------------------------------------
// Variações (numeração / estoque)
// ---------------------------------------------------------------------------

export async function addVariantAction(productId: string, size: string, stock: number): Promise<ActionState> {
  const user = await requireUser();
  if (!size.trim()) return { success: false, message: "Informe a numeração" };

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { success: false, message: "Produto não encontrado" };

  const existing = await prisma.productVariant.findUnique({ where: { productId_size: { productId, size } } });
  if (existing) return { success: false, message: "Essa numeração já existe para este produto." };

  const sku = `${product.sku}-${size}`;
  const variant = await prisma.productVariant.create({
    data: { productId, size, stock: Math.max(stock, 0), sku },
  });

  if (stock > 0) {
    await prisma.inventoryMovement.create({
      data: { variantId: variant.id, type: "IN", quantity: stock, reason: "Estoque inicial", userId: user.id },
    });
  }

  await recordAudit({ userId: user.id, action: "CREATE", entityType: "ProductVariant", entityId: variant.id, after: { size, stock } });
  revalidatePath(`/admin/produtos/${productId}`);
  return { success: true };
}

export async function updateVariantStockAction(variantId: string, newStock: number, reason: string): Promise<ActionState> {
  const user = await requireUser();
  if (newStock < 0) return { success: false, message: "Estoque não pode ser negativo." };

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return { success: false, message: "Variação não encontrada." };

  const diff = newStock - variant.stock;
  if (diff === 0) return { success: true };

  await prisma.$transaction([
    prisma.productVariant.update({ where: { id: variantId }, data: { stock: newStock } }),
    prisma.inventoryMovement.create({
      data: {
        variantId,
        type: "ADJUST",
        quantity: diff,
        reason: reason || "Ajuste manual pelo administrador",
        userId: user.id,
      },
    }),
  ]);

  await recordAudit({
    userId: user.id,
    action: "ADJUST_STOCK",
    entityType: "ProductVariant",
    entityId: variantId,
    before: { stock: variant.stock },
    after: { stock: newStock, reason },
  });

  revalidatePath(`/admin/produtos/${variant.productId}`);
  revalidatePath("/admin/estoque");
  return { success: true };
}

export async function toggleVariantActiveAction(variantId: string) {
  const user = await requireUser();
  const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  await prisma.productVariant.update({ where: { id: variantId }, data: { active: !variant.active } });
  await recordAudit({ userId: user.id, action: "TOGGLE_ACTIVE", entityType: "ProductVariant", entityId: variantId });
  revalidatePath(`/admin/produtos/${variant.productId}`);
}

// ---------------------------------------------------------------------------
// Imagens
// ---------------------------------------------------------------------------

export async function uploadProductImagesAction(productId: string, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { success: false, message: "Selecione ao menos uma imagem." };

  const currentCount = await prisma.productImage.count({ where: { productId } });

  let position = currentCount;
  for (const file of files) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
      return { success: false, message: `Tipo de arquivo não permitido: ${file.type}` };
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return { success: false, message: `Arquivo muito grande (máx. ${MAX_UPLOAD_SIZE_BYTES / 1024 / 1024}MB).` };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await storage.saveImage(buffer, file.name, `products/${productId}`);

    await prisma.productImage.create({
      data: {
        productId,
        url: saved.main.url,
        thumbUrl: saved.thumb.url,
        position,
        isMain: currentCount === 0 && position === currentCount,
      },
    });
    position += 1;
  }

  await recordAudit({ userId: user.id, action: "UPLOAD_IMAGES", entityType: "Product", entityId: productId, after: { count: files.length } });
  revalidatePath(`/admin/produtos/${productId}`);
  return { success: true };
}

export async function deleteProductImageAction(imageId: string) {
  const user = await requireUser();
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return;

  await prisma.productImage.delete({ where: { id: imageId } });
  await storage.delete(image.url);
  if (image.thumbUrl) await storage.delete(image.thumbUrl);

  if (image.isMain) {
    const next = await prisma.productImage.findFirst({ where: { productId: image.productId }, orderBy: { position: "asc" } });
    if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isMain: true } });
  }

  await recordAudit({ userId: user.id, action: "DELETE_IMAGE", entityType: "Product", entityId: image.productId });
  revalidatePath(`/admin/produtos/${image.productId}`);
}

export async function setMainImageAction(imageId: string) {
  const user = await requireUser();
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image) return;

  await prisma.$transaction([
    prisma.productImage.updateMany({ where: { productId: image.productId }, data: { isMain: false } }),
    prisma.productImage.update({ where: { id: imageId }, data: { isMain: true } }),
  ]);

  await recordAudit({ userId: user.id, action: "SET_MAIN_IMAGE", entityType: "Product", entityId: image.productId });
  revalidatePath(`/admin/produtos/${image.productId}`);
}

export async function reorderImagesAction(productId: string, orderedIds: string[]) {
  await requireUser();
  await prisma.$transaction(orderedIds.map((id, index) => prisma.productImage.update({ where: { id }, data: { position: index } })));
  revalidatePath(`/admin/produtos/${productId}`);
}
