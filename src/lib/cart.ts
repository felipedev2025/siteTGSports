import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/auth/session";

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002";
}

const CART_COOKIE = "tg_cart_token";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 dias — carrinho persiste entre visitas

async function getOrCreateCartToken(): Promise<string> {
  const store = await cookies();
  let token = store.get(CART_COOKIE)?.value;
  if (!token) {
    token = randomUUID();
    store.set(CART_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CART_COOKIE_MAX_AGE,
    });
  }
  return token;
}

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: { include: { images: { orderBy: { position: "asc" as const }, take: 1 } } },
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

type CartInner = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export async function getOrCreateCart() {
  const token = await getOrCreateCartToken();
  const customer = await getCurrentCustomer();

  // Layout e página podem disparar esta função quase simultaneamente para a
  // mesma requisição (RSC renderiza árvores em paralelo), então duas
  // tentativas de criar o carrinho com o mesmo token podem colidir mesmo
  // usando upsert. Em caso de corrida, apenas relemos o carrinho já criado
  // pela outra chamada.
  let cart: CartInner;
  try {
    cart = await prisma.cart.upsert({
      where: { token },
      update: {},
      create: { token, customerId: customer?.id ?? null },
      include: cartInclude,
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      cart = await prisma.cart.findUniqueOrThrow({ where: { token }, include: cartInclude });
    } else {
      throw err;
    }
  }

  if (customer && cart.customerId !== customer.id) {
    cart = await prisma.cart.update({
      where: { id: cart.id },
      data: { customerId: customer.id },
      include: cartInclude,
    });
  }

  return cart;
}

export type CartWithItems = Awaited<ReturnType<typeof getOrCreateCart>>;

export async function addItemToCart(variantId: string, quantity: number) {
  if (quantity < 1) throw new Error("Quantidade inválida");

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });
  if (!variant || !variant.active || variant.product.status !== "ACTIVE") {
    throw new Error("Produto/variação indisponível");
  }

  const cart = await getOrCreateCart();
  const existing = cart.items.find((i) => i.variantId === variantId);
  const newQuantity = Math.min((existing?.quantity ?? 0) + quantity, 10);

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    update: { quantity: newQuantity },
    create: { cartId: cart.id, variantId, quantity: newQuantity },
  });

  await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const cart = await getOrCreateCart();
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) throw new Error("Item não encontrado no carrinho");

  if (quantity < 1) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return;
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: Math.min(quantity, 10) } });
}

export async function removeCartItem(itemId: string) {
  const cart = await getOrCreateCart();
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) return;
  await prisma.cartItem.delete({ where: { id: itemId } });
}

export async function clearCart(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
}

/** Ao logar, funde o carrinho de visitante (cookie) com o carrinho existente do cliente, se houver. */
export async function mergeGuestCartIntoCustomer(customerId: string) {
  const token = await getOrCreateCartToken();
  const guestCart = await prisma.cart.findUnique({ where: { token }, include: { items: true } });
  if (!guestCart) return;

  const customerCart = await prisma.cart.findFirst({
    where: { customerId, NOT: { id: guestCart.id } },
    include: { items: true },
  });

  if (!customerCart) {
    await prisma.cart.update({ where: { id: guestCart.id }, data: { customerId } });
    return;
  }

  for (const item of guestCart.items) {
    const existing = customerCart.items.find((i) => i.variantId === item.variantId);
    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(existing.quantity + item.quantity, 10) },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: customerCart.id, variantId: item.variantId, quantity: item.quantity },
      });
    }
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
}
