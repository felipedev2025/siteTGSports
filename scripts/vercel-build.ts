/**
 * Build script usado como "Build Command" na Vercel.
 *
 * Resolve DATABASE_URL e DIRECT_URL a partir de nomes alternativos (ver
 * src/lib/db-url-fallbacks.ts — mesma lógica usada pela aplicação em
 * runtime), aplica as migrations pendentes contra o banco de produção
 * (usando a conexão DIRETA, não a pooled — necessário para o advisory lock
 * do Prisma Migrate funcionar através de um pgbouncer/pooler como o do
 * Neon) e então builda a aplicação.
 */
import { execSync } from "node:child_process";
import { resolveDatabaseUrl, resolveDirectUrl } from "../src/lib/db-url-fallbacks";

const usedDbKey = resolveDatabaseUrl(process.env);
const usedDirectKey = resolveDirectUrl(process.env);

if (!process.env.DATABASE_URL) {
  console.error(
    "[vercel-build] DATABASE_URL não está definida e nenhuma variável alternativa foi encontrada. Conecte um banco Postgres ao projeto na Vercel."
  );
  process.exit(1);
}

if (usedDbKey) {
  console.log(`[vercel-build] DATABASE_URL não definida diretamente — usando o valor de ${usedDbKey}`);
}
if (usedDirectKey) {
  console.log(`[vercel-build] DIRECT_URL não definida diretamente — usando o valor de ${usedDirectKey}`);
}

function run(command: string) {
  console.log(`[vercel-build] $ ${command}`);
  execSync(command, { stdio: "inherit", env: process.env });
}

run("npx prisma migrate deploy");
run("npx next build");
