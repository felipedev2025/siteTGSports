import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/shipping";
import { InstitutionalPage } from "@/components/storefront/InstitutionalPage";

export const metadata: Metadata = { title: "Sobre nós" };

export default async function AboutPage() {
  const settings = await getStoreSettings();
  return (
    <InstitutionalPage
      title="Sobre a TG Sports"
      content={settings.aboutContent}
      fallback="A TG Sports é uma loja especializada em tênis e calçados esportivos, sediada em Jaú/SP. Nosso compromisso é oferecer produtos 100% originais, com atendimento próximo e entrega para todo o Brasil. Este texto institucional pode ser editado a qualquer momento pelo painel administrativo, em Configurações."
    />
  );
}
