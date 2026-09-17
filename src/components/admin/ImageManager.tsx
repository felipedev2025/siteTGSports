"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
  uploadProductImagesAction,
  deleteProductImageAction,
  setMainImageAction,
  reorderImagesAction,
} from "@/app/admin/produtos/actions";

interface ImageItem {
  id: string;
  url: string;
  thumbUrl: string | null;
  isMain: boolean;
}

export function ImageManager({ productId, images }: { productId: string; images: ImageItem[] }) {
  const [items, setItems] = useState(images);
  const [isDragOver, setIsDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dragIndex = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function uploadFiles(files: FileList | File[]) {
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    startTransition(async () => {
      const result = await uploadProductImagesAction(productId, formData);
      if (!result.success) setMessage(result.message ?? "Erro ao enviar imagens");
      else window.location.reload();
    });
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
  }

  function handleReorder(fromIndex: number, toIndex: number) {
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
    startTransition(() => reorderImagesAction(productId, next.map((i) => i.id)));
  }

  return (
    <div className="rounded-2xl border border-tggray-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-bold text-navy-900">Fotos do produto</h3>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
          isDragOver ? "border-blue-500 bg-blue-50" : "border-tggray-200 hover:border-blue-300"
        }`}
      >
        <p className="text-sm font-semibold text-navy-800">Arraste e solte as imagens aqui</p>
        <p className="mt-1 text-xs text-tggray-500">ou clique para selecionar (JPG, PNG ou WebP, até 8MB cada)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {isPending && <p className="mt-2 text-xs text-blue-600">Enviando...</p>}
      {message && <p className="mt-2 text-xs text-red-600">{message}</p>}

      {items.length > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {items.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => (dragIndex.current = index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex.current !== null && dragIndex.current !== index) handleReorder(dragIndex.current, index);
                dragIndex.current = null;
              }}
              className="group relative aspect-square cursor-move overflow-hidden rounded-lg border border-tggray-200"
            >
              <Image src={img.thumbUrl ?? img.url} alt="" fill sizes="120px" className="object-cover" />
              {img.isMain && (
                <span className="absolute left-1 top-1 rounded bg-navy-900 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  PRINCIPAL
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition group-hover:opacity-100">
                {!img.isMain && (
                  <button
                    type="button"
                    title="Definir como principal"
                    onClick={() => startTransition(() => setMainImageAction(img.id))}
                    className="rounded bg-white px-1.5 py-1 text-[10px] font-bold text-navy-900"
                  >
                    Principal
                  </button>
                )}
                <button
                  type="button"
                  title="Excluir"
                  onClick={() => {
                    setItems((prev) => prev.filter((i) => i.id !== img.id));
                    startTransition(() => deleteProductImageAction(img.id));
                  }}
                  className="rounded bg-red-600 px-1.5 py-1 text-[10px] font-bold text-white"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
