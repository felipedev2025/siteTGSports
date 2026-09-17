"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { updateSettingsAction } from "@/app/admin/configuracoes/actions";
import type { Settings } from "@prisma/client";

const inputClass = "w-full rounded-lg border border-tggray-200 px-3 py-2.5 text-sm";
const labelClass = "mb-1 block text-xs font-semibold text-navy-800";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSettingsAction(formData);
      setMessage(result.message ?? null);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-tggray-200 bg-white p-5 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-sm font-bold text-navy-900">Loja</h2>
        <div className="sm:col-span-2">
          <label className={labelClass}>Logo da loja</label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-dashed border-tggray-200 bg-tggray-50 transition hover:border-blue-400 hover:bg-blue-50"
            >
              {logoPreview || settings.logoUrl ? (
                <Image src={logoPreview ?? settings.logoUrl!} alt="Logo" fill className="object-contain" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px] text-tggray-400 group-hover:text-blue-500">
                  sem logo
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-navy-900/0 text-[10px] font-semibold text-white opacity-0 transition group-hover:bg-navy-900/50 group-hover:opacity-100">
                trocar
              </span>
            </button>
            <div className="flex-1">
              <input
                ref={logoInputRef}
                type="file"
                name="logo"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="rounded-full border border-tggray-200 px-3 py-1.5 text-xs font-semibold text-navy-800 hover:border-blue-400 hover:text-blue-600"
              >
                {logoPreview ? "Escolher outra imagem" : "Escolher imagem"}
              </button>
              <p className="mt-1 text-xs text-tggray-500">
                PNG, JPG ou WebP, fundo transparente recomendado. Aparece no cabeçalho, rodapé e tela de login do
                painel. Clique na caixa ou no botão para enviar — a imagem só é salva ao clicar em &quot;Salvar
                configurações&quot;.
              </p>
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass}>Nome da loja</label>
          <input name="storeName" defaultValue={settings.storeName} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>WhatsApp (com DDD)</label>
          <input name="whatsappNumber" defaultValue={settings.whatsappNumber ?? ""} placeholder="5514900000000" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Instagram</label>
          <input name="instagramUrl" defaultValue={settings.instagramUrl ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>E-mail de contato</label>
          <input name="contactEmail" defaultValue={settings.contactEmail ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Telefone de contato</label>
          <input name="contactPhone" defaultValue={settings.contactPhone ?? ""} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Endereço (Jaú/SP)</label>
          <input name="addressLine" defaultValue={settings.addressLine ?? ""} className={inputClass} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-tggray-200 bg-white p-5 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-sm font-bold text-navy-900">Frete e retirada</h2>
        <div>
          <label className={labelClass}>CEP da loja</label>
          <input name="storeCep" defaultValue={settings.storeCep ?? ""} className={inputClass} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-navy-800">
            <input type="checkbox" name="pickupEnabled" defaultChecked={settings.pickupEnabled} className="h-4 w-4 accent-blue-600" />
            Habilitar retirada na loja
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Instruções de retirada</label>
          <textarea name="pickupInstructions" rows={2} defaultValue={settings.pickupInstructions ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Valor do frete fixo (R$)</label>
          <input type="number" step="0.01" name="fixedShipping" defaultValue={settings.fixedShippingCents / 100} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Frete grátis acima de (R$)</label>
          <input type="number" step="0.01" name="freeShippingAbove" defaultValue={settings.freeShippingAboveCents ? settings.freeShippingAboveCents / 100 : ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Prazo adicional (dias úteis)</label>
          <input type="number" name="extraDeliveryDays" defaultValue={settings.extraDeliveryDays} className={inputClass} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-tggray-200 bg-white p-5">
        <h2 className="text-sm font-bold text-navy-900">Conteúdo institucional</h2>
        <div>
          <label className={labelClass}>Sobre nós</label>
          <textarea name="aboutContent" rows={3} defaultValue={settings.aboutContent ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Trocas e devoluções</label>
          <textarea name="exchangePolicy" rows={3} defaultValue={settings.exchangePolicy ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Política de privacidade</label>
          <textarea name="privacyPolicy" rows={3} defaultValue={settings.privacyPolicy ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Termos de uso</label>
          <textarea name="termsOfUse" rows={3} defaultValue={settings.termsOfUse ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Política de entrega</label>
          <textarea name="deliveryPolicy" rows={3} defaultValue={settings.deliveryPolicy ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Dúvidas frequentes</label>
          <textarea name="faqContent" rows={3} defaultValue={settings.faqContent ?? ""} className={inputClass} />
        </div>
      </section>

      {message && <p className="text-sm font-medium text-blue-700">{message}</p>}
      <button type="submit" disabled={isPending} className="w-fit rounded-full bg-blue-600 px-8 py-3 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}
