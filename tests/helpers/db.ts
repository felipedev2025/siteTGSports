import { prisma } from "@/lib/db";

export async function resetDb() {
  await prisma.paymentEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.couponUsage.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockReservation.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.customerAddress.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestProduct(opts?: { priceCents?: number; stock?: number; pixDiscountPercent?: number }) {
  const suffix = Math.random().toString(36).slice(2, 8);
  const product = await prisma.product.create({
    data: {
      name: `Produto Teste ${suffix}`,
      slug: `produto-teste-${suffix}`,
      sku: `TEST-${suffix}`,
      priceCents: opts?.priceCents ?? 10000,
      pixDiscountPercent: opts?.pixDiscountPercent ?? 0,
      status: "ACTIVE",
    },
  });

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      size: "40",
      sku: `TEST-${suffix}-40`,
      stock: opts?.stock ?? 10,
    },
  });

  return { product, variant };
}
