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

run("npx prisma migrate deploy");
run("npx next build");
