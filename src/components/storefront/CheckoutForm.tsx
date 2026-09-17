"use client";

import { useEffect, useState, useTransition } from "react";
import { centsToBRL } from "@/lib/money";
import {
  submitCheckoutAction,
  previewTotalsAction,
  lookupCepAction,
  type CheckoutFormState,
} from "@/app/(storefront)/checkout/actions";

interface CheckoutFormProps {
  pickupEnabled: boolean;
  pickupInstructions?: string | null;
  defaultName?: string;
  defaultEmail?: string;
}

const inputClass =
  "w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm text-navy-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-1 block text-xs font-semibold text-navy-800";

export function CheckoutForm({ pickupEnabled, pickupInstructions, defaultName, defaultEmail }: CheckoutFormProps) {
  const [deliveryType, setDeliveryType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [couponCode, setCouponCode] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewTotalsAction>> | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [address, setAddress] = useState({ street: "", district: "", city: "", state: "" });
  const [state, setFormState] = useState<CheckoutFormState | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPreviewPending, startPreviewTransition] = useTransition();

  useEffect(() => {
    startPreviewTransition(async () => {
      const result = await previewTotalsAction({ paymentMethod, deliveryType, couponCode: couponCode || undefined });
      setPreview(result);
    });
  }, [paymentMethod, deliveryType, couponCode]);

  async function handleCepBlur(e: React.FocusEvent<HTMLInputElement>) {
    const cep = e.target.value;
    if (cep.replace(/\D/g, "").length !== 8) return;
    setCepLoading(true);
    const result = await lookupCepAction(cep);
    setCepLoading(false);
    if (result) {
      setAddress({ street: result.street, district: result.district, city: result.city, state: result.state });
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw: Record<string, string> = {};
    formData.forEach((value, key) => (raw[key] = String(value)));
    raw.deliveryType = deliveryType;
    raw.paymentMethod = paymentMethod;
    raw.couponCode = couponCode;

    startTransition(async () => {
      const result = await submitCheckoutAction(raw);
      setFormState(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <section className="rounded-2xl border border-tggray-200 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-navy-900">Seus dados</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nome completo</label>
              <input name="customerName" required defaultValue={defaultName} className={inputClass} />
              <FieldError state={state} field="customerName" />
            </div>
            <div>
              <label className={labelClass}>CPF</label>
              <input name="customerCpf" required placeholder="000.000.000-00" className={inputClass} />
              <FieldError state={state} field="customerCpf" />
            </div>
            <div>
              <label className={labelClass}>WhatsApp</label>
              <input name="customerPhone" required placeholder="(14) 90000-0000" className={inputClass} />
              <FieldError state={state} field="customerPhone" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>E-mail</label>
              <input type="email" name="customerEmail" required defaultValue={defaultEmail} className={inputClass} />
              <FieldError state={state} field="customerEmail" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-tggray-200 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-navy-900">Entrega</h2>
          <div className="mb-4 flex gap-3">
            <button
              type="button"
              onClick={() => setDeliveryType("DELIVERY")}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold ${
                deliveryType === "DELIVERY" ? "border-navy-900 bg-navy-900 text-white" : "border-tggray-200 text-navy-800"
              }`}
            >
              Entrega
            </button>
            {pickupEnabled && (
              <button
                type="button"
                onClick={() => setDeliveryType("PICKUP")}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold ${
                  deliveryType === "PICKUP" ? "border-navy-900 bg-navy-900 text-white" : "border-tggray-200 text-navy-800"
                }`}
              >
                Retirar na loja
              </button>
            )}
          </div>

          {deliveryType === "PICKUP" ? (
            <p className="rounded-lg bg-tggray-50 p-3 text-sm text-tggray-700">
              {pickupInstructions || "Retire seu pedido em nossa loja em Jaú/SP após a confirmação do pagamento."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className={labelClass}>CEP {cepLoading && "(buscando...)"}</label>
                <input name="shippingCep" onBlur={handleCepBlur} placeholder="00000-000" className={inputClass} />
                <FieldError state={state} field="shippingCep" />
              </div>
              <div className="sm:col-span-4">
                <label className={labelClass}>Rua</label>
                <input
                  name="shippingStreet"
                  defaultValue={address.street}
                  key={address.street}
                  className={inputClass}
                />
                <FieldError state={state} field="shippingStreet" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Número</label>
                <input name="shippingNumber" className={inputClass} />
                <FieldError state={state} field="shippingNumber" />
              </div>
              <div className="sm:col-span-4">
                <label className={labelClass}>Complemento</label>
                <input name="shippingComplement" className={inputClass} />
              </div>
              <div className="sm:col-span-3">
                <label className={labelClass}>Bairro</label>
                <input name="shippingDistrict" defaultValue={address.district} key={address.district} className={inputClass} />
                <FieldError state={state} field="shippingDistrict" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Cidade</label>
                <input name="shippingCity" defaultValue={address.city} key={address.city} className={inputClass} />
                <FieldError state={state} field="shippingCity" />
              </div>
              <div className="sm:col-span-1">
                <label className={labelClass}>UF</label>
                <input name="shippingState" defaultValue={address.state} key={address.state} maxLength={2} className={inputClass} />
                <FieldError state={state} field="shippingState" />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-tggray-200 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-navy-900">Pagamento</h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("PIX")}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold ${
                paymentMethod === "PIX" ? "border-navy-900 bg-navy-900 text-white" : "border-tggray-200 text-navy-800"
              }`}
            >
              PIX
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("CREDIT_CARD")}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold ${
                paymentMethod === "CREDIT_CARD" ? "border-navy-900 bg-navy-900 text-white" : "border-tggray-200 text-navy-800"
              }`}
            >
              Cartão de crédito
            </button>
          </div>
          <p className="mt-3 text-xs text-tggray-500">
            Você será redirecionado para o ambiente seguro do Asaas para concluir o pagamento.
          </p>
        </section>

        <section className="rounded-2xl border border-tggray-200 p-5">
          <label className={labelClass}>Observações (opcional)</label>
          <textarea name="notes" rows={2} className={inputClass} />
        </section>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-24 rounded-2xl border border-tggray-200 p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-navy-900">Resumo do pedido</h2>

          <div className="mb-4 flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Cupom de desconto"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => setCouponCode(couponInput)}
              className="rounded-lg bg-tggray-100 px-3 text-xs font-bold text-navy-900"
            >
              Aplicar
            </button>
          </div>
          {preview && !preview.empty && preview.couponError && (
            <p className="mb-3 text-xs text-red-600">Cupom inválido ou não aplicável.</p>
          )}
          {preview && !preview.empty && preview.couponApplied && (
            <p className="mb-3 text-xs text-green-600">Cupom {preview.couponApplied} aplicado!</p>
          )}

          {preview && !preview.empty ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-tggray-700">
                <span>Subtotal</span>
                <span>{centsToBRL(preview.totals.subtotalCents)}</span>
              </div>
              {preview.totals.discountCents > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>-{centsToBRL(preview.totals.discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-tggray-700">
                <span>Frete ({preview.shippingLabel})</span>
                <span>{preview.totals.shippingCents === 0 ? "Grátis" : centsToBRL(preview.totals.shippingCents)}</span>
              </div>
              <div className="flex justify-between border-t border-tggray-200 pt-2 text-base font-bold text-navy-900">
                <span>Total</span>
                <span>{centsToBRL(preview.totals.totalCents)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-tggray-500">{isPreviewPending ? "Calculando..." : "Carrinho vazio"}</p>
          )}

          {state && !state.success && state.message && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">{state.message}</p>
          )}

          <button
            type="submit"
            disabled={isPending || !preview || preview.empty}
            className="mt-5 w-full rounded-full bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-60"
          >
            {isPending ? "Processando..." : "IR PARA PAGAMENTO"}
          </button>
        </div>
      </div>
    </form>
  );
}

function FieldError({ state, field }: { state: CheckoutFormState | null; field: string }) {
  const msg = state?.fieldErrors?.[field];
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}
