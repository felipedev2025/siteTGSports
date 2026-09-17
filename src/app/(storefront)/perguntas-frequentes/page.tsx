import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/shipping";
import { InstitutionalPage } from "@/components/storefront/InstitutionalPage";

export const metadata: Metadata = { title: "Dúvidas frequentes" };

export default async function FaqPage() {
  const settings = await getStoreSettings();
  return (
    <InstitutionalPage
      title="Dúvidas frequentes"
      content={settings.faqContent}
      fallback={
        "Como faço para trocar meu tênis?\nConsulte nossa página de Trocas e devoluções.\n\nQuais formas de pagamento vocês aceitam?\nPIX e cartão de crédito, processados com segurança via Asaas.\n\nVocês entregam em todo o Brasil?\nSim! E também oferecemos retirada em Jaú/SP."
      }
    />
  );
}
