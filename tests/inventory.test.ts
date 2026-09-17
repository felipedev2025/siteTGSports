import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/db";
import {
  reserveStockForOrder,
  confirmStockForOrder,
  releaseStockForOrder,
  getAvailableStock,
  sweepExpiredReservations,
  OutOfStockError,
} from "@/lib/inventory";
import { resetDb, createTestProduct } from "./helpers/db";

async function makeOrder() {
  return prisma.order.create({
    data: {
      orderNumber: `TEST-${Math.random().toString(36).slice(2, 8)}`,
      customerName: "Cliente Teste",
      customerEmail: "teste@example.com",
      customerPhone: "14999999999",
      customerCpf: "39053344705",
      deliveryType: "PICKUP",
      subtotalCents: 10000,
      totalCents: 10000,
    },
  });
}

describe("estoque e reservas", () => {
  beforeEach(resetDb);
  afterAll(async () => prisma.$disconnect());

  it("reserva estoque com sucesso quando há disponibilidade", async () => {
    const { variant } = await createTestProduct({ stock: 5 });
    const order = await makeOrder();

    await prisma.$transaction((tx) => reserveStockForOrder(tx, order.id, [{ variantId: variant.id, quantity: 3 }], 30));

    const available = await getAvailableStock(variant.id);
    expect(available).toBe(2);
  });

  it("nunca permite reservar mais do que o disponível (evita overselling)", async () => {
    const { variant } = await createTestProduct({ stock: 2 });
    const order = await makeOrder();

    await expect(
      prisma.$transaction((tx) => reserveStockForOrder(tx, order.id, [{ variantId: variant.id, quantity: 3 }], 30))
    ).rejects.toThrow(OutOfStockError);

    // nada deve ter sido reservado (transação revertida)
    const available = await getAvailableStock(variant.id);
    expect(available).toBe(2);
  });

  it("duas reservas concorrentes para o mesmo item não permitem overselling", async () => {
    const { variant } = await createTestProduct({ stock: 5 });
    const orderA = await makeOrder();
    const orderB = await makeOrder();

    const results = await Promise.allSettled([
      prisma.$transaction((tx) => reserveStockForOrder(tx, orderA.id, [{ variantId: variant.id, quantity: 3 }], 30)),
      prisma.$transaction((tx) => reserveStockForOrder(tx, orderB.id, [{ variantId: variant.id, quantity: 3 }], 30)),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.filter((r) => r.status === "rejected").length;

    // estoque = 5, cada pedido pede 3 → apenas um pode ser atendido
    expect(fulfilled).toBe(1);
    expect(rejected).toBe(1);

    const available = await getAvailableStock(variant.id);
    expect(available).toBe(2);
  });

  it("confirmar reserva dá baixa definitiva no estoque físico", async () => {
    const { variant } = await createTestProduct({ stock: 5 });
    const order = await makeOrder();

    await prisma.$transaction((tx) => reserveStockForOrder(tx, order.id, [{ variantId: variant.id, quantity: 2 }], 30));
    await prisma.$transaction((tx) => confirmStockForOrder(tx, order.id));

    const updated = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(updated.stock).toBe(3);

    const movement = await prisma.inventoryMovement.findFirst({ where: { variantId: variant.id, type: "OUT" } });
    expect(movement?.quantity).toBe(2);
  });

  it("liberar reserva de pedido cancelado devolve a disponibilidade sem alterar o estoque físico", async () => {
    const { variant } = await createTestProduct({ stock: 5 });
    const order = await makeOrder();

    await prisma.$transaction((tx) => reserveStockForOrder(tx, order.id, [{ variantId: variant.id, quantity: 4 }], 30));
    expect(await getAvailableStock(variant.id)).toBe(1);

    await prisma.$transaction((tx) => releaseStockForOrder(tx, order.id, "RELEASED"));

    expect(await getAvailableStock(variant.id)).toBe(5);
    const updated = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(updated.stock).toBe(5); // físico não muda — só a reserva
  });

  it("varredura expira reservas vencidas e libera a disponibilidade", async () => {
    const { variant } = await createTestProduct({ stock: 5 });
    const order = await makeOrder();

    // TTL negativo → já nasce expirada
    await prisma.$transaction((tx) => reserveStockForOrder(tx, order.id, [{ variantId: variant.id, quantity: 2 }], -1));

    const count = await sweepExpiredReservations();
    expect(count).toBeGreaterThanOrEqual(1);

    const available = await getAvailableStock(variant.id);
    expect(available).toBe(5);
  });
});
