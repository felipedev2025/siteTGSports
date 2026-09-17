/**
 * Cria (ou promove) o primeiro administrador da loja.
 *
 * Uso:
 *   npm run create-admin -- --name="Seu Nome" --email=admin@tgsports.com.br --password="SenhaForte123"
 *
 * Se o e-mail já existir, a senha e o papel (ADMIN) são atualizados.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

async function main() {
  const name = getArg("name");
  const email = getArg("email");
  const password = getArg("password");

  if (!name || !email || !password) {
    console.error(
      'Uso: npm run create-admin -- --name="Seu Nome" --email=admin@tgsports.com.br --password="SenhaForte123"'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("A senha deve ter no mínimo 8 caracteres.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", active: true, name },
    create: { name, email, passwordHash, role: "ADMIN" },
  });

  console.log(`✔ Administrador pronto: ${user.email} (id: ${user.id})`);
  console.log("Acesse /admin/login para entrar no painel.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
