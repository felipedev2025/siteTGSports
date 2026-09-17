import { z } from "zod";

export const cpfRegex = /^\d{11}$/;
export const cepRegex = /^\d{8}$/;

const digitsOnly = (v: string) => v.replace(/\D/g, "");

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(3, "Informe o nome completo").max(150),
    customerCpf: z
      .string()
      .transform(digitsOnly)
      .refine((v) => cpfRegex.test(v), "CPF inválido"),
    customerEmail: z.string().trim().email("E-mail inválido"),
    customerPhone: z
      .string()
      .transform(digitsOnly)
      .refine((v) => v.length >= 10 && v.length <= 11, "WhatsApp inválido"),
    deliveryType: z.enum(["DELIVERY", "PICKUP"]),
    shippingCep: z.string().optional(),
    shippingStreet: z.string().optional(),
    shippingNumber: z.string().optional(),
    shippingComplement: z.string().optional(),
    shippingDistrict: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingState: z.string().optional(),
    couponCode: z.string().trim().optional(),
    paymentMethod: z.enum(["PIX", "CREDIT_CARD"]),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryType === "DELIVERY") {
      const required: (keyof typeof data)[] = [
        "shippingCep",
        "shippingStreet",
        "shippingNumber",
        "shippingDistrict",
        "shippingCity",
        "shippingState",
      ];
      for (const field of required) {
        if (!data[field] || String(data[field]).trim().length === 0) {
          ctx.addIssue({ code: "custom", path: [field], message: "Campo obrigatório para entrega" });
        }
      }
      if (data.shippingCep && !cepRegex.test(digitsOnly(data.shippingCep))) {
        ctx.addIssue({ code: "custom", path: ["shippingCep"], message: "CEP inválido" });
      }
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
