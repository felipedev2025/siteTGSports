import { NextRequest, NextResponse } from "next/server";
import { isValidAsaasWebhookToken } from "@/lib/asaas/webhook";
import { processAsaasWebhook } from "@/lib/orders/webhook-handler";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.headers.get("asaas-access-token");

  if (!isValidAsaasWebhookToken(token)) {
    // Não vazar detalhes — apenas 401.
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rawBody = await req.text();

  try {
    const result = await processAsaasWebhook(rawBody);

    if (result.outcome === "error") {
      // Registrado para investigação manual, mas respondemos 200 para não
      // entrar em loop de reentrega infinito quando o problema é definitivo
      // (ex: pedido não encontrado). Erros transitórios (ex: banco fora do ar)
      // caem no catch abaixo e retornam 500, fazendo o Asaas tentar de novo.
      return NextResponse.json({ received: true, outcome: result }, { status: 200 });
    }

    return NextResponse.json({ received: true, outcome: result }, { status: 200 });
  } catch (err) {
    console.error("[asaas-webhook] erro ao processar evento", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
