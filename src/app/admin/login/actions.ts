"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createAdminSession } from "@/lib/auth/session";
import { adminLoginSchema } from "@/lib/validation/auth";
import { rateLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";

export interface AdminLoginState {
  success: boolean;
  message?: string;
}

export async function loginAdminAction(raw: Record<string, string>, next?: string): Promise<AdminLoginState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok } = rateLimit(`login:admin:${ip}`, 10, 60_000);
  if (!ok) return { success: false, message: "Muitas tentativas. Aguarde um instante." };

  const parsed = adminLoginSchema.safeParse(raw);
  if (!parsed.success) return { success: false, message: "E-mail ou senha inválidos." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.active) return { success: false, message: "E-mail ou senha inválidos." };

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { success: false, message: "E-mail ou senha inválidos." };

  await createAdminSession(user.id, user.role);
  await recordAudit({ userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id, ip });

  redirect(next && next.startsWith("/admin") ? next : "/admin");
}
