// Algumas integrações de banco da Vercel (ex.: Neon, conectado com um
// "Custom Prefix" configurado) criam a variável de ambiente com um nome
// diferente de DATABASE_URL — mas o schema do Prisma está fixo em
// env("DATABASE_URL"). Em vez de tentar adivinhar o nome exato (o conjunto
// de nomes que essas integrações criam varia e nem sempre bate com a
// documentação), escaneamos todas as env vars à procura de um VALOR que
// pareça uma connection string do Postgres — isso funciona independente de
// como a variável foi nomeada.
const POSTGRES_URL_PATTERN = /^postgres(ql)?:\/\//i;

// Pistas de nome usadas só para desempatar quando existe mais de uma
// connection string candidata — preferimos a pensada para uso com Prisma /
// pooled sobre variantes "_UNPOOLED" ou "_NO_SSL".
const NAME_PRIORITY = [/PRISMA/i, /^(STORAGE_)?DATABASE_URL$/i, /POSTGRES_URL$/i];

function priorityOf(key: string): number {
  const index = NAME_PRIORITY.findIndex((pattern) => pattern.test(key));
  return index === -1 ? NAME_PRIORITY.length : index;
}

/**
 * Garante DATABASE_URL. Se já estiver definida, não faz nada. Caso
 * contrário, procura entre todas as env vars a que tiver o valor no formato
 * de connection string do Postgres e usa essa. Retorna o nome da variável
 * usada, ou null se DATABASE_URL já estava definida ou nenhuma candidata foi
 * encontrada.
 */
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.DATABASE_URL) return null;

  const candidates = Object.entries(env)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string" && POSTGRES_URL_PATTERN.test(entry[1]))
    .sort((a, b) => priorityOf(a[0]) - priorityOf(b[0]));

  const best = candidates[0];
  if (!best) return null;

  env.DATABASE_URL = best[1];
  return best[0];
}
