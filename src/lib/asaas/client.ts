import "server-only";

// -----------------------------------------------------------------------------
// Cliente HTTP para a API do Asaas (https://docs.asaas.com).
// Todas as chamadas acontecem no backend — a API key NUNCA é exposta ao browser.
//
// Endpoints usados (validados na documentação oficial em docs.asaas.com,
// setembro/2026):
//   - POST /v3/customers            → cadastro de cliente pagador
//   - GET  /v3/customers?cpfCnpj=   → busca cliente existente (evita duplicidade)
//   - POST /v3/checkouts            → cria uma sessão de Checkout hospedada pelo
//                                      Asaas (PIX / Cartão de crédito), reduzindo
//                                      a superfície de dados sensíveis de cartão
//                                      manipulados pela nossa aplicação.
//   - GET  /v3/checkouts/{id}       → consulta o status de um checkout
//   - POST /v3/webhooks             → cria/gerencia o webhook (feito via painel
//                                      Asaas ou uma vez via script, ver README)
//
// Caso a documentação oficial mude algum campo, ajustar SOMENTE este arquivo —
// o resto da aplicação depende apenas das funções exportadas abaixo.
// -----------------------------------------------------------------------------

type AsaasEnv = "sandbox" | "production";

function getEnv(): AsaasEnv {
  const env = process.env.ASAAS_ENV;
  return env === "production" ? "production" : "sandbox";
}

function getBaseUrl(): string {
  if (process.env.ASAAS_BASE_URL) return process.env.ASAAS_BASE_URL.replace(/\/$/, "");
  return getEnv() === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não configurada no ambiente.");
  return key;
}

export class AsaasError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown
  ) {
    super(message);
    this.name = "AsaasError";
  }
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: getApiKey(),
      "User-Agent": "TGSports-Ecommerce",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      body?.errors?.[0]?.description ?? body?.message ?? `Erro ${res.status} ao chamar Asaas (${path})`;
    throw new AsaasError(message, res.status, body);
  }

  return body as T;
}

// ---------------------------------------------------------------------------
// Clientes (payers)
// ---------------------------------------------------------------------------

export interface AsaasCustomerInput {
  name: string;
  cpfCnpj: string;
  email: string;
  mobilePhone?: string;
  postalCode?: string;
  addressNumber?: string;
  externalReference?: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email: string;
}

export async function findAsaasCustomerByCpf(cpfCnpj: string): Promise<AsaasCustomer | null> {
  const result = await asaasFetch<{ data: AsaasCustomer[] }>(
    `/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`
  );
  return result.data?.[0] ?? null;
}

export async function createAsaasCustomer(input: AsaasCustomerInput): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Busca cliente existente pelo CPF/CNPJ; cria caso não exista. Evita duplicidade no Asaas. */
export async function getOrCreateAsaasCustomer(input: AsaasCustomerInput): Promise<AsaasCustomer> {
  const existing = await findAsaasCustomerByCpf(input.cpfCnpj);
  if (existing) return existing;
  return createAsaasCustomer(input);
}

// ---------------------------------------------------------------------------
// Checkout (página de pagamento hospedada pelo Asaas)
// ---------------------------------------------------------------------------

export type AsaasBillingType = "PIX" | "CREDIT_CARD" | "BOLETO";

export interface AsaasCheckoutItem {
  name: string;
  description?: string;
  quantity: number;
  value: number; // em reais (decimal), conforme documentação
}

export interface CreateCheckoutInput {
  billingTypes: AsaasBillingType[];
  externalReference: string;
  minutesToExpire?: number;
  customer?: string; // id do customer no Asaas
  customerData?: {
    name: string;
    cpfCnpj: string;
    email: string;
    phone?: string;
  };
  items: AsaasCheckoutItem[];
  callback: {
    successUrl: string;
    cancelUrl?: string;
    expiredUrl?: string;
  };
}

export interface AsaasCheckout {
  id: string;
  status?: string;
  link?: string;
}

export async function createAsaasCheckout(input: CreateCheckoutInput): Promise<AsaasCheckout> {
  const payload = {
    billingTypes: input.billingTypes,
    chargeTypes: ["DETACHED"],
    minutesToExpire: input.minutesToExpire ?? 60,
    externalReference: input.externalReference,
    customer: input.customer,
    customerData: input.customer ? undefined : input.customerData,
    items: input.items,
    callback: input.callback,
  };

  const result = await asaasFetch<AsaasCheckout>("/checkouts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    ...result,
    link: result.link ?? `https://asaas.com/checkoutSession/show?id=${result.id}`,
  };
}

export async function getAsaasCheckout(id: string): Promise<AsaasCheckout> {
  return asaasFetch<AsaasCheckout>(`/checkouts/${id}`);
}

export function checkoutHostedUrl(checkoutId: string): string {
  return `https://asaas.com/checkoutSession/show?id=${checkoutId}`;
}
