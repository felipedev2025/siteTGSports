"use client";

import Image from "next/image";
import { useState } from "react";

interface GalleryImage {
  url: string;
  altText?: string | null;
}

export function Gallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-tggray-200 bg-tggray-50">
        {current ? (
          <Image
            src={current.url}
            alt={current.altText ?? productName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-tggray-400">Sem foto disponível</div>
        )}
      </div>

      {images.length > 1 && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                i === active ? "border-blue-600" : "border-tggray-200 opacity-80 hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt={img.altText ?? productName} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
