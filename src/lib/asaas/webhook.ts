import "server-only";
import { timingSafeEqual } from "crypto";

/**
 * O Asaas envia o token configurado no cadastro do Webhook no header
 * `asaas-access-token` em toda notificação. Validamos com comparação de
 * tempo constante para evitar timing attacks.
 */
export function isValidAsaasWebhookToken(headerValue: string | null): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected || !headerValue) return false;

  const a = Buffer.from(headerValue);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

// Eventos de Checkout e de Cobrança que tratamos. Qualquer outro evento
// recebido é apenas registrado (para auditoria) e ignorado.
export const HANDLED_CHECKOUT_EVENTS = ["CHECKOUT_PAID", "CHECKOUT_CANCELED", "CHECKOUT_EXPIRED"] as const;

export const HANDLED_PAYMENT_EVENTS = [
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_REFUNDED",
  "PAYMENT_DELETED",
  "PAYMENT_RESTORED",
] as const;
