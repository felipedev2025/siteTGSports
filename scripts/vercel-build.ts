/**
 * Build script usado como "Build Command" na Vercel.
 *
 * Resolve DATABASE_URL a partir de nomes alternativos (ver
 * src/lib/db-url-fallbacks.ts — mesma lógica usada pela aplicação em
 * runtime), aplica as migrations pendentes contra o banco de produção e
 * então builda a aplicação.
 */
import { execSync } from "node:child_process";
import { resolveDatabaseUrl } from "../src/lib/db-url-fallbacks";

const usedKey = resolveDatabaseUrl(process.env);

if (!process.env.DATABASE_URL) {
  console.error(
    "[vercel-build] DATABASE_URL não está definida e nenhuma variável alternativa foi encontrada. Conecte um banco Postgres ao projeto na Vercel."
  );
  process.exit(1);
}

if (usedKey) {
  console.log(`[vercel-build] DATABASE_URL não definida diretamente — usando o valor de ${usedKey}`);
}

function run(command: string) {
  console.log(`[vercel-build] $ ${command}`);
  execSync(command, { stdio: "inherit", env: process.env });
}

// "prisma migrate deploy" precisa de um advisory lock do Postgres que nao
// funciona de forma confiavel atraves do pooler (pgbouncer) do Neon, entao
// usamos aqui uma connection string direta / nao-pooled para as migrations.
if (!process.env.DIRECT_DATABASE_URL) {
  const direct =
    process.env.STORAGE_DATABASE_POSTGRES_URL_NON_POOLING ||
    process.env.STORAGE_DATABASE_DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL;
  if (direct) {
    process.env.DIRECT_DATABASE_URL = direct;
  }
}

run("npx prisma migrate deploy");
run("npx next build");
