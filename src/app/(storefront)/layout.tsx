import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";
import { getOrCreateCart } from "@/lib/cart";
import { getStoreSettings } from "@/lib/shipping";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const [cart, settings] = await Promise.all([getOrCreateCart(), getStoreSettings()]);
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Header cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton phone={settings.whatsappNumber} />
    </>
  );
}
