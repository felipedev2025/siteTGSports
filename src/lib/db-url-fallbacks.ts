// Algumas integrações de banco da Vercel (ex.: Neon, conectado com um
// "Custom Prefix" configurado) criam a variável de ambiente com um nome
// diferente de DATABASE_URL — mas o schema do Prisma está fixo em
// env("DATABASE_URL"). Lista completa do conjunto padrão de variáveis que a
// integração Neon/Vercel Postgres cria (com e sem prefixo "STORAGE_"),
// ordenada por preferência: strings de conexão prontas para uso primeiro
// (não os pedaços soltos como PGHOST/PGUSER/PGPASSWORD, que não formam uma
// URL sozinhos).
export const DATABASE_URL_FALLBACK_KEYS = [
  "STORAGE_DATABASE_URL",
  "STORAGE_POSTGRES_PRISMA_URL",
  "STORAGE_POSTGRES_URL",
  "STORAGE_DATABASE_URL_UNPOOLED",
  "STORAGE_POSTGRES_URL_NON_POOLING",
  "STORAGE_POSTGRES_URL_NO_SSL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_NO_SSL",
];

/** Garante DATABASE_URL a partir do primeiro nome alternativo com valor não vazio. Retorna a chave usada, ou null se DATABASE_URL já estava definida ou nenhuma alternativa foi encontrada. */
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.DATABASE_URL) return null;
  const key = DATABASE_URL_FALLBACK_KEYS.find((k) => env[k]);
  if (key) {
    env.DATABASE_URL = env[key];
    return key;
  }
  return null;
}
