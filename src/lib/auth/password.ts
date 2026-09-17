// Sem `import "server-only"` aqui de propósito: este módulo também é usado
// por scripts standalone (seed, criação do primeiro admin) executados fora
// do bundler do Next.js. Nunca é importado por um componente cliente.
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
