"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createCustomerSession, destroyCustomerSession } from "@/lib/auth/session";
import { customerRegisterSchema, customerLoginSchema } from "@/lib/validation/auth";
import { mergeGuestCartIntoCustomer } from "@/lib/cart";
import { rateLimit } from "@/lib/rate-limit";

export interface AuthFormState {
  success: boolean;
  message?: string;
}

export async function registerCustomerAction(raw: Record<string, string>): Promise<AuthFormState> {
  const parsed = customerRegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existing = await prisma.customer.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { success: false, message: "Já existe uma conta com este e-mail." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const customer = await prisma.customer.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash,
    },
  });

  await createCustomerSession(customer.id);
  await mergeGuestCartIntoCustomer(customer.id);
  redirect("/minha-conta");
}

export async function loginCustomerAction(raw: Record<string, string>): Promise<AuthFormState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok } = rateLimit(`login:customer:${ip}`, 10, 60_000);
  if (!ok) return { success: false, message: "Muitas tentativas. Aguarde um instante." };

  const parsed = customerLoginSchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: "E-mail ou senha inválidos." };

  const customer = await prisma.customer.findUnique({ where: { email: parsed.data.email } });
  if (!customer || !customer.passwordHash || !customer.active) {
    return { success: false, message: "E-mail ou senha inválidos." };
  }

  const valid = await verifyPassword(parsed.data.password, customer.passwordHash);
  if (!valid) return { success: false, message: "E-mail ou senha inválidos." };

  await createCustomerSession(customer.id);
  await mergeGuestCartIntoCustomer(customer.id);
  redirect("/minha-conta");
}

export async function logoutCustomerAction() {
  await destroyCustomerSession();
  redirect("/");
}
