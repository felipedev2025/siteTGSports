#!/usr/bin/env node
/**
 * Build script usado como "Build Command" na Vercel.
 *
 * Resolve DATABASE_URL a partir de nomes alternativos que integrações de
 * Postgres da Vercel podem criar (ex.: com um "Custom Prefix" configurado,
 * vira STORAGE_DATABASE_URL em vez de DATABASE_URL — mas o schema do Prisma
 * está fixo em env("DATABASE_URL")), aplica as migrations pendentes contra o
 * banco de produção e então builda a aplicação.
 */
import { execSync } from "node:child_process";

const FALLBACK_KEYS = [
  "STORAGE_DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "STORAGE_POSTGRES_URL",
  "STORAGE_DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
];

if (!process.env.DATABASE_URL) {
  const key = FALLBACK_KEYS.find((k) => process.env[k]);
  if (key) {
    console.log(`[vercel-build] DATABASE_URL não definida — usando o valor de ${key}`);
    process.env.DATABASE_URL = process.env[key];
  } else {
    console.error(
      "[vercel-build] DATABASE_URL não está definida e nenhuma variável alternativa (STORAGE_DATABASE_URL, POSTGRES_URL, ...) foi encontrada. Conecte um banco Postgres ao projeto na Vercel."
    );
    process.exit(1);
  }
}

function run(command) {
  console.log(`[vercel-build] $ ${command}`);
  execSync(command, { stdio: "inherit", env: process.env });
}

run("npx prisma migrate deploy");
run("npx next build");
