"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createAdminSession } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export interface SetupState {
  success: boolean;
  message?: string;
}

export async function createFirstAdminAction(raw: Record<string, string>): Promise<SetupState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok } = rateLimit(`admin-setup:${ip}`, 5, 60_000);
  if (!ok) return { success: false, message: "Muitas tentativas. Aguarde um instante." };

  // Boundary de segurança: essa página só funciona enquanto NENHUM admin existir.
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) {
    return { success: false, message: "Já existe um administrador configurado. Use a tela de login normal." };
  }

  const name = (raw.name ?? "").trim();
  const email = (raw.email ?? "").trim().toLowerCase();
  const password = raw.password ?? "";
  const confirmPassword = raw.confirmPassword ?? "";

  if (name.length < 3) return { success: false, message: "Informe seu nome completo." };
  if (!email.includes("@")) return { success: false, message: "E-mail inválido." };
  if (password.length < 8) return { success: false, message: "A senha deve ter no mínimo 8 caracteres." };
  if (password !== confirmPassword) return { success: false, message: "As senhas não conferem." };

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await prisma.user.create({
      data: { name, email, passwordHash, role: "ADMIN" },
    });
  } catch {
    return { success: false, message: "Já existe uma conta com este e-mail." };
  }

  await createAdminSession(user.id, user.role);
  await recordAudit({ userId: user.id, action: "SETUP_FIRST_ADMIN", entityType: "User", entityId: user.id, ip });

  redirect("/admin");
}
