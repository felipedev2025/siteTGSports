import { z } from "zod";

export const customerRegisterSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo"),
  email: z.string().trim().email("E-mail inválido"),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 11, "WhatsApp inválido"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});

export const customerLoginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});
