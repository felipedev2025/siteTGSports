import Image from "next/image";
import { prisma } from "@/lib/db";
import { QuickCreateBanner } from "@/components/admin/QuickCreateBanner";
import { ToggleActiveButton } from "@/components/admin/ToggleActiveButton";
import { toggleBannerActiveAction, deleteBannerAction } from "./actions";

export default async function BannersPage() {
  const banners = await prisma.banner.findMany({ orderBy: { position: "asc" } });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-extrabold text-navy-900">Banners</h1>
      <QuickCreateBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-2xl border border-tggray-200 bg-white">
            <div className="relative h-32 w-full">
              <Image src={b.imageUrl} alt={b.title} fill className="object-cover" />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-navy-900">{b.title}</p>
              <div className="mt-2 flex items-center justify-between">
                <ToggleActiveButton active={b.active} action={toggleBannerActiveAction.bind(null, b.id)} />
                <form action={deleteBannerAction.bind(null, b.id)}>
                  <button className="text-xs font-semibold text-red-600">Excluir</button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && <p className="text-sm text-tggray-500">Nenhum banner cadastrado ainda.</p>}
      </div>
    </div>
  );
}
