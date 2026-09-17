import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/admin/Sidebar";
import { Logo } from "@/components/storefront/Logo";
import { logoutAdminAction } from "./actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // O proxy já protege /admin/*, mas login sem layout de sidebar.
  if (!user) {
    return <>{children}</>;
  }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  return (
    <div className="flex min-h-screen bg-tggray-50">
      <aside className="hidden w-64 shrink-0 bg-navy-950 lg:block">
        <div className="flex items-center gap-2 border-b border-white/10 p-4">
          <Logo logoUrl={settings?.logoUrl} size={36} showText={false} badgeClassName="bg-blue-600" />
          <span className="text-sm font-bold text-white">Painel TG Sports</span>
        </div>
        <Sidebar />
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-tggray-200 bg-white px-6 py-3">
          <p className="text-sm font-medium text-navy-900">
            Olá, {user.name} <span className="text-tggray-400">({user.role === "ADMIN" ? "Administrador" : "Equipe"})</span>
          </p>
          <form action={logoutAdminAction}>
            <button className="text-sm font-semibold text-red-600">Sair</button>
          </form>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
