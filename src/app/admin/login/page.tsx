import { prisma } from "@/lib/db";
import { Logo } from "@/components/storefront/Logo";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default async function AdminLoginPage() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-2">
          <Logo logoUrl={settings?.logoUrl} size={40} showText={false} />
          <span>
            <p className="text-base font-extrabold text-navy-900">TG Sports</p>
            <p className="text-xs text-tggray-500">Painel administrativo</p>
          </span>
        </div>

        <AdminLoginForm />
      </div>
    </div>
  );
}
