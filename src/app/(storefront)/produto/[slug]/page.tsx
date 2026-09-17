import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getAvailableStockMap } from "@/lib/inventory";
import { getStoreSettings } from "@/lib/shipping";
import { Gallery } from "@/components/storefront/Gallery";
import { PriceBlock } from "@/components/storefront/PriceBlock";
import { ProductActions } from "@/components/storefront/ProductActions";
import { ShippingEstimator } from "@/components/storefront/ShippingEstimator";
import { Accordion } from "@/components/storefront/Accordion";
import { ProductRail } from "@/components/storefront/ProductRail";
import { FavoriteButton } from "@/components/storefront/FavoriteButton";

export async function generateMetadata({ params }: PageProps<"/produto/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = product.metaTitle || `${product.name} | TG Sports`;
  const description = product.metaDescription || product.shortDescription || undefined;
  const image = product.images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/produto/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [stockMap, settings] = await Promise.all([
    getAvailableStockMap(product.variants.map((v) => v.id)),
    getStoreSettings(),
  ]);

  const variantOptions = product.variants.map((v) => ({
    id: v.id,
    size: v.size,
    available: Math.max(stockMap.get(v.id) ?? 0, 0),
  }));

  const categoryIds = product.categories.map((c) => c.categoryId);
  const related = await getRelatedProducts(product.id, categoryIds, product.brandId);

  const measurements = (product.measurementsTable as { size: string; cm: string }[] | null) ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => i.url),
    description: product.shortDescription ?? product.description ?? undefined,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability:
        variantOptions.some((v) => v.available > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/produto/${product.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:pb-10 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-5 text-xs text-tggray-500">
        <Link href="/" className="hover:text-blue-600">Início</Link> /{" "}
        <Link href="/produtos" className="hover:text-blue-600">Produtos</Link> /{" "}
        <span className="text-navy-800">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <Gallery images={product.images} productName={product.name} />

        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              {product.brand && (
                <span className="text-xs font-bold uppercase tracking-wide text-blue-600">{product.brand.name}</span>
              )}
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{product.name}</h1>
              <p className="mt-1 text-xs text-tggray-500">SKU: {product.sku}</p>
            </div>
            <FavoriteButton productId={product.id} className="mt-1 shrink-0" />
          </div>

          <div className="mt-4">
            <PriceBlock
              priceCents={product.priceCents}
              compareAtCents={product.compareAtCents}
              pixDiscountPercent={product.pixDiscountPercent}
              size="lg"
            />
          </div>

          {product.shortDescription && (
            <p className="mt-4 text-sm leading-relaxed text-tggray-700">{product.shortDescription}</p>
          )}

          <div className="mt-6">
            <ProductActions variants={variantOptions} />
          </div>

          <div className="mt-6">
            <ShippingEstimator />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-tggray-600">
            <div className="rounded-lg bg-tggray-50 p-2.5">100% Original</div>
            <div className="rounded-lg bg-tggray-50 p-2.5">Pagamento seguro</div>
            <div className="rounded-lg bg-tggray-50 p-2.5">Troca facilitada</div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Accordion
            items={[
              {
                id: "descricao",
                title: "Descrição",
                content: product.description ? (
                  <div className="whitespace-pre-line">{product.description}</div>
                ) : (
                  "Sem descrição adicional."
                ),
              },
              {
                id: "tabela-medidas",
                title: "Tabela de medidas",
                content: measurements ? (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-tggray-200">
                        <th className="py-1.5 pr-4 font-semibold">Numeração</th>
                        <th className="py-1.5 font-semibold">Comprimento (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((m) => (
                        <tr key={m.size} className="border-b border-tggray-100">
                          <td className="py-1.5 pr-4">{m.size}</td>
                          <td className="py-1.5">{m.cm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  "Consulte a tabela de medidas da marca antes de finalizar a compra."
                ),
              },
              {
                id: "trocas",
                title: "Política de troca",
                content: settings.exchangePolicy || "Consulte nossa política de trocas e devoluções.",
              },
              {
                id: "entrega",
                title: "Entrega",
                content: settings.deliveryPolicy || "Enviamos para todo o Brasil. Retirada disponível em Jaú/SP.",
              },
              {
                id: "pagamento",
                title: "Formas de pagamento",
                content: "PIX (com desconto quando disponível) e cartão de crédito, processados com segurança via Asaas.",
              },
            ]}
          />
        </div>
      </div>

      <ProductRail title="Você também pode gostar" products={related} />
    </div>
  );
}
