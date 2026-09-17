import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/shipping";

export const metadata: Metadata = { title: "Contato" };

export default async function ContactPage() {
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight text-navy-900">Fale com a gente</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-tggray-200 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">E-mail</p>
          <p className="mt-1 text-sm text-navy-900">{settings.contactEmail || "contato@tgsports.com.br"}</p>
        </div>
        <div className="rounded-2xl border border-tggray-200 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">WhatsApp</p>
          <p className="mt-1 text-sm text-navy-900">{settings.contactPhone || settings.whatsappNumber || "—"}</p>
        </div>
        <div className="rounded-2xl border border-tggray-200 p-5 sm:col-span-2">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Endereço</p>
          <p className="mt-1 text-sm text-navy-900">{settings.addressLine || "Jaú/SP"}</p>
        </div>
      </div>
    </div>
  );
}
