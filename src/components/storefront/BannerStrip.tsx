import Image from "next/image";
import Link from "next/link";
import type { Banner } from "@prisma/client";

export function BannerStrip({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="scrollbar-none flex gap-4 overflow-x-auto">
        {banners.map((banner) => {
          const content = (
            <div className="relative flex h-40 w-full shrink-0 snap-start items-end overflow-hidden rounded-2xl sm:h-56 sm:w-[480px]">
              <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" />
              <div className="relative z-10 w-full bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-lg font-extrabold text-white">{banner.title}</p>
                {banner.subtitle && <p className="text-sm text-white/85">{banner.subtitle}</p>}
              </div>
            </div>
          );
          return banner.link ? (
            <Link key={banner.id} href={banner.link}>{content}</Link>
          ) : (
            <div key={banner.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
