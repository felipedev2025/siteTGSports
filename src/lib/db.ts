import { PrismaClient } from "@prisma/client";

// Algumas integrações de banco da Vercel (ex.: conectar um Postgres com um
// "Custom Prefix" configurado) criam a variável de ambiente com um nome
// diferente de DATABASE_URL (ex.: STORAGE_DATABASE_URL). O schema do Prisma
// está fixo em `env("DATABASE_URL")`, então aqui garantimos essa variável
// antes de instanciar o client, testando os nomes alternativos mais comuns
// gerados por integrações de Postgres na Vercel (Neon, Vercel Postgres, etc.).
const DATABASE_URL_FALLBACK_KEYS = [
  "STORAGE_DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "STORAGE_POSTGRES_URL",
];

if (!process.env.DATABASE_URL) {
  const fallbackKey = DATABASE_URL_FALLBACK_KEYS.find((key) => process.env[key]);
  if (fallbackKey) {
    process.env.DATABASE_URL = process.env[fallbackKey];
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
