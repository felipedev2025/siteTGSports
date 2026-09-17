/**
 * Seed de DEMONSTRAÇÃO — dados fictícios, claramente marcados como DEMO.
 * NÃO representa produtos, preços ou fotos reais da TG Sports.
 * O administrador deve cadastrar o catálogo real pelo painel administrativo.
 *
 * Uso: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slug";
import { storage } from "../src/lib/storage/storage";
import { generatePlaceholderImage } from "../src/lib/storage/placeholder";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed DEMO — iniciando...");

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      storeName: "TG Sports",
      storeCep: "17201-000",
      pickupEnabled: true,
      pickupInstructions: "Retire seu pedido em nossa loja em Jaú/SP, de segunda a sábado, das 9h às 18h.",
      fixedShippingCents: 2490,
      freeShippingAboveCents: 39900,
      extraDeliveryDays: 2,
      whatsappNumber: "",
      instagramUrl: "https://instagram.com/tauany.grizzo",
      contactEmail: "contato@tgsports.com.br",
      contactPhone: "",
      addressLine: "Jaú/SP",
    },
  });
  console.log("✔ Configurações padrão");

  const brandNames = ["Nike", "Adidas", "Asics", "Mizuno", "Olympikus", "Puma"];
  const brands = [];
  for (const name of brandNames) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    brands.push(brand);
  }
  console.log(`✔ ${brands.length} marcas (DEMO — cadastro/autorização real deve ser feito pela TG Sports)`);

  const categoryNames = ["Basquete", "Corrida", "Treino", "Casual"];
  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    categories.push(category);
  }
  console.log(`✔ ${categories.length} categorias`);

  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log("Produtos já existem — pulando criação de produtos demo.");
  } else {
    const demoProducts = [
      { name: "Tênis Performance Run [DEMO]", brand: "Nike", category: "Corrida", price: 69990, compareAt: 79990, pix: 8, gender: "MASCULINO", featured: true, sale: true, isNew: false },
      { name: "Tênis Court Basket [DEMO]", brand: "Adidas", category: "Basquete", price: 89990, compareAt: null, pix: 5, gender: "MASCULINO", featured: true, sale: false, isNew: true },
      { name: "Tênis Gel Trainer [DEMO]", brand: "Asics", category: "Treino", price: 59990, compareAt: 69990, pix: 10, gender: "FEMININO", featured: false, sale: true, isNew: false },
      { name: "Tênis Urban Casual [DEMO]", brand: "Puma", category: "Casual", price: 39990, compareAt: null, pix: 0, gender: "UNISSEX", featured: false, sale: false, isNew: true },
      { name: "Tênis Speed Wave [DEMO]", brand: "Mizuno", category: "Corrida", price: 74990, compareAt: 84990, pix: 7, gender: "FEMININO", featured: true, sale: true, isNew: false },
      { name: "Tênis Street Move [DEMO]", brand: "Olympikus", category: "Casual", price: 29990, compareAt: null, pix: 0, gender: "MASCULINO", featured: false, sale: false, isNew: false },
    ];

    for (const p of demoProducts) {
      const brand = brands.find((b) => b.name === p.brand)!;
      const category = categories.find((c) => c.name === p.category)!;
      const slug = slugify(p.name);
      const sku = `DEMO-${slug.toUpperCase().slice(0, 10)}`;

      const product = await prisma.product.create({
        data: {
          name: p.name,
          slug,
          sku,
          brandId: brand.id,
          shortDescription: "[DEMO] Produto fictício para demonstração da loja. Substitua pelo catálogo real no painel administrativo.",
          description:
            "[DEMO] Este é um produto de demonstração gerado automaticamente pelo seed inicial. Nenhuma informação aqui (preço, fotos, descrição) representa produtos reais da TG Sports. Cadastre os produtos verdadeiros em Admin > Produtos.",
          priceCents: p.price,
          compareAtCents: p.compareAt,
          pixDiscountPercent: p.pix,
          gender: p.gender,
          isFeatured: p.featured,
          isOnSale: p.sale,
          isNew: p.isNew,
          status: "ACTIVE",
          measurementsTable: [
            { size: "38", cm: "24.0" },
            { size: "40", cm: "25.5" },
            { size: "42", cm: "27.0" },
            { size: "44", cm: "28.5" },
          ],
          categories: { create: [{ categoryId: category.id }] },
        },
      });

      const sizes = ["38", "39", "40", "41", "42", "43", "44"];
      const stocks = [0, 2, 5, 8, 4, 1, 0];
      for (let i = 0; i < sizes.length; i++) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            size: sizes[i],
            sku: `${sku}-${sizes[i]}`,
            stock: stocks[i],
          },
        });
      }

      const imageBuffer = await generatePlaceholderImage(p.name);
      const saved = await storage.saveImage(imageBuffer, "demo.png", `products/${product.id}`);
      await prisma.productImage.create({
        data: { productId: product.id, url: saved.main.url, thumbUrl: saved.thumb.url, isMain: true, position: 0 },
      });

      console.log(`  ✔ Produto demo: ${p.name}`);
    }
  }

  const existingCoupon = await prisma.coupon.findUnique({ where: { code: "TGSPORTS10" } });
  if (!existingCoupon) {
    await prisma.coupon.create({
      data: { code: "TGSPORTS10", type: "PERCENT", value: 10, active: true },
    });
    console.log("✔ Cupom demo TGSPORTS10 (10% off)");
  }

  console.log("\nSeed DEMO concluído. Lembre-se: crie o primeiro administrador com `npm run create-admin`.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
