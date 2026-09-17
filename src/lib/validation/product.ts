import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome do produto"),
  slug: z.string().trim().optional(),
  sku: z.string().trim().min(1, "Informe o SKU"),
  brandId: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  description: z.string().trim().optional(),
  costPriceCents: z.coerce.number().int().min(0).optional(),
  priceCents: z.coerce.number().int().min(1, "Informe um preço válido"),
  compareAtCents: z.coerce.number().int().min(0).optional(),
  pixDiscountPercent: z.coerce.number().int().min(0).max(100).default(0),
  gender: z.string().optional(),
  isFeatured: z.coerce.boolean().default(false),
  isOnSale: z.coerce.boolean().default(false),
  isNew: z.coerce.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  categoryIds: z.array(z.string()).default([]),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
