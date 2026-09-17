import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { STORAGE_ROOT } from "@/lib/storage/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;

  // Bloqueia qualquer tentativa de directory traversal (ex: ../../etc/passwd)
  if (segments.some((s) => s.includes("..") || s.includes("\0"))) {
    return NextResponse.json({ error: "Caminho inválido" }, { status: 400 });
  }

  const relativePath = segments.join("/");
  const filePath = path.join(STORAGE_ROOT, relativePath);

  if (!filePath.startsWith(STORAGE_ROOT)) {
    return NextResponse.json({ error: "Caminho inválido" }, { status: 400 });
  }

  try {
    await stat(filePath);
    const file = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }
}
