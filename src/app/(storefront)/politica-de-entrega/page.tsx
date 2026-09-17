import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/shipping";
import { InstitutionalPage } from "@/components/storefront/InstitutionalPage";

export const metadata: Metadata = { title: "Política de entrega" };

export default async function DeliveryPolicyPage() {
  const settings = await getStoreSettings();
  return (
    <InstitutionalPage
      title="Política de entrega"
      content={settings.deliveryPolicy}
      fallback="Enviamos para todo o Brasil. Também oferecemos retirada gratuita em nossa loja em Jaú/SP. Os prazos de entrega são calculados no checkout de acordo com o seu CEP. Edite este texto em Configurações no painel administrativo."
    />
  );
}
