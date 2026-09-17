import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/shipping";
import { InstitutionalPage } from "@/components/storefront/InstitutionalPage";

export const metadata: Metadata = { title: "Trocas e devoluções" };

export default async function ExchangePage() {
  const settings = await getStoreSettings();
  return (
    <InstitutionalPage
      title="Trocas e devoluções"
      content={settings.exchangePolicy}
      fallback="Conteúdo padrão — ainda não revisado juridicamente. Edite esta política em Configurações no painel administrativo antes de publicar oficialmente. Em geral, produtos podem ser trocados em até 7 dias corridos após o recebimento, desde que não tenham sido usados e estejam com embalagem original."
    />
  );
}
