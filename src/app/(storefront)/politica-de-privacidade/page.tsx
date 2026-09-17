import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/shipping";
import { InstitutionalPage } from "@/components/storefront/InstitutionalPage";

export const metadata: Metadata = { title: "Política de privacidade" };

export default async function PrivacyPage() {
  const settings = await getStoreSettings();
  return (
    <InstitutionalPage
      title="Política de privacidade"
      content={settings.privacyPolicy}
      fallback="Conteúdo padrão — ainda não revisado juridicamente. A TG Sports coleta apenas os dados necessários para processar pedidos (nome, CPF, e-mail, telefone e endereço), em conformidade com a LGPD. Edite este texto em Configurações no painel administrativo antes de publicar oficialmente."
    />
  );
}
