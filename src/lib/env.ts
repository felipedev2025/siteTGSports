// Helper centralizado para ler NEXT_PUBLIC_APP_URL com fallback seguro.
// Usa `||` (não `??`): na Vercel, uma env var configurada mas deixada em
// branco chega como string vazia (não undefined), e `??` não cobre esse
// caso — quebra `new URL("")` em produção.
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
