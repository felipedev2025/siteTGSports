import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Logo } from "@/components/storefront/Logo";
import { AdminSetupForm } from "@/components/admin/AdminSetupForm";

// Página de configuração inicial — cria o primeiro administrador direto pelo
// navegador (sem precisar de terminal). Só funciona enquanto NENHUM usuário
// com papel ADMIN existir; depois disso, redireciona para o login normal.
// Isso é o que garante a segurança da página (ver actions.ts).
export default async function AdminSetupPage() {
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) redirect("/admin/login");

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-2">
          <Logo logoUrl={settings?.logoUrl} size={40} showText={false} />
          <span>
            <p className="text-base font-extrabold text-navy-900">TG Sports</p>
            <p className="text-xs text-tggray-500">Configuração inicial</p>
          </span>
        </div>

        <p className="mb-5 text-sm text-tggray-600">
          Crie a primeira conta de administrador da loja. Esta página fica desabilitada automaticamente depois do
          primeiro uso.
        </p>

        <AdminSetupForm />
      </div>
    </div>
  );
}
