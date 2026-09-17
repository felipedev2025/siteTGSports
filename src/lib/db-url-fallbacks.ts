// Algumas integrações de banco da Vercel (ex.: Neon, conectado com um
// "Custom Prefix" configurado) criam a variável de ambiente com um nome
// diferente de DATABASE_URL — mas o schema do Prisma está fixo em
// env("DATABASE_URL")/env("DIRECT_URL"). Em vez de tentar adivinhar o nome
// exato (o conjunto de nomes que essas integrações criam varia e nem sempre
// bate com a documentação), escaneamos todas as env vars à procura de um
// VALOR que pareça uma connection string do Postgres — isso funciona
// independente de como a variável foi nomeada.
const POSTGRES_URL_PATTERN = /^postgres(ql)?:\/\//i;

// Pistas de nome para desempatar quando existe mais de uma connection string
// candidata.
const POOLED_HINTS = [/PRISMA/i, /^(STORAGE_)?DATABASE_URL$/i, /POOL(?!ING)/i, /POSTGRES_URL$/i];
const DIRECT_HINTS = [/UNPOOLED/i, /NON_POOLING/i, /\bDIRECT\b/i, /NO_SSL/i];

function score(key: string, hints: RegExp[]): number {
  const index = hints.findIndex((pattern) => pattern.test(key));
  return index === -1 ? hints.length : index;
}

function findPostgresUrlEntries(env: NodeJS.ProcessEnv): [string, string][] {
  return Object.entries(env).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && POSTGRES_URL_PATTERN.test(entry[1])
  );
}

/**
 * Garante DATABASE_URL. Se já estiver definida, não faz nada. Caso
 * contrário, procura entre todas as env vars a que tiver o valor no formato
 * de connection string do Postgres, priorizando nomes que sugerem uma
 * conexão via pool (a indicada para o Prisma Client em runtime). Retorna o
 * nome da variável usada, ou null se DATABASE_URL já estava definida ou
 * nenhuma candidata foi encontrada.
 */
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.DATABASE_URL) return null;

  const candidates = findPostgresUrlEntries(env).sort((a, b) => score(a[0], POOLED_HINTS) - score(b[0], POOLED_HINTS));

  const best = candidates[0];
  if (!best) return null;

  env.DATABASE_URL = best[1];
  return best[0];
}

/**
 * Garante DIRECT_URL (usada só pelo Prisma Migrate — ver prisma/schema.prisma).
 * Uma conexão via pgbouncer/pooler (ex.: Neon) não sustenta o advisory lock
 * que o Migrate usa, então precisamos de uma conexão direta aqui, mesmo que
 * o Prisma Client em runtime use a pooled (DATABASE_URL) normalmente.
 * Prioriza nomes que sugerem conexão direta/não-pooled; na ausência de uma
 * candidata clara, cai de volta para o valor de DATABASE_URL (mesmo
 * comportamento de antes — funciona em dev local, onde a conexão já é
 * direta de qualquer forma).
 */
export function resolveDirectUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.DIRECT_URL) return null;

  const candidates = findPostgresUrlEntries(env).sort((a, b) => score(a[0], DIRECT_HINTS) - score(b[0], DIRECT_HINTS));

  const best = candidates.find(([key]) => DIRECT_HINTS.some((pattern) => pattern.test(key))) ?? candidates[0];
  if (!best) return null;

  env.DIRECT_URL = best[1];
  return best[0];
}
