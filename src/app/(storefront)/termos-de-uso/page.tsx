import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/shipping";
import { InstitutionalPage } from "@/components/storefront/InstitutionalPage";

export const metadata: Metadata = { title: "Termos de uso" };

export default async function TermsPage() {
  const settings = await getStoreSettings();
  return (
    <InstitutionalPage
      title="Termos de uso"
      content={settings.termsOfUse}
      fallback="Conteúdo padrão — ainda não revisado juridicamente. Ao utilizar o site da TG Sports, você concorda com nossas condições de compra, preços e políticas de entrega. Edite este texto em Configurações no painel administrativo antes de publicar oficialmente."
    />
  );
}
