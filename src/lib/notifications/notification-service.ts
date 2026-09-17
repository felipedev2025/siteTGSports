import "server-only";

// -----------------------------------------------------------------------------
// Camada de notificações, desacoplada da regra de negócio.
//
// Hoje: apenas registra em log (nenhuma credencial de WhatsApp foi fornecida).
// Amanhã: implementar `WhatsAppNotificationChannel` (Z-API, API oficial da Meta,
// etc.) e trocar a instância exportada abaixo — nenhum outro arquivo precisa
// mudar, pois todos dependem apenas da interface `NotificationService`.
// -----------------------------------------------------------------------------

export type NotificationEvent =
  | "ORDER_RECEIVED"
  | "PAYMENT_APPROVED"
  | "ORDER_PACKING"
  | "ORDER_SHIPPED"
  | "ORDER_READY_FOR_PICKUP";

export interface NotificationPayload {
  event: NotificationEvent;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
}

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
}

class LoggingNotificationChannel implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<void> {
    // Substituir por uma chamada real (Z-API, WhatsApp Cloud API, etc.) quando
    // a TG Sports fornecer as credenciais. Mantido como no-op/log por padrão
    // para nunca falhar um fluxo de pedido por causa de notificação.
    console.log(`[notification] ${payload.event} — pedido ${payload.orderNumber} — cliente ${payload.customerName}`);
  }
}

export const notificationService: NotificationChannel = new LoggingNotificationChannel();
