// Sem `import "server-only"` aqui de propósito: este módulo também é usado
// pelo script de seed (executado fora do bundler do Next.js). Nunca é
// importado por um componente cliente.
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import sharp from "sharp";

// -----------------------------------------------------------------------------
// Abstração de armazenamento de arquivos.
//
// - Local (padrão em desenvolvimento e em qualquer host com disco persistente):
//   grava em `storage/uploads/`, servido via `/api/media/[...path]`.
// - Vercel Blob (selecionado automaticamente quando `BLOB_READ_WRITE_TOKEN`
//   está definido — é o que a Vercel injeta ao conectar um Blob Store ao
//   projeto): necessário porque o filesystem das Serverless/Edge Functions da
//   Vercel é efêmero e não compartilhado entre instâncias, então gravar em
//   disco lá não persiste os uploads.
//
// Qualquer novo driver (S3, R2, etc.) só precisa implementar `StorageDriver`
// — nada mais na aplicação depende da implementação concreta.
// -----------------------------------------------------------------------------

export interface StoredFile {
  /** identificador interno do arquivo dentro do driver (usado para exclusão) */
  path: string;
  /** URL pública da imagem */
  url: string;
}

export interface StorageDriver {
  saveImage(buffer: Buffer, originalName: string, folder: string): Promise<{ main: StoredFile; thumb: StoredFile }>;
  /** Recebe a URL previamente retornada por `saveImage` (armazenada no banco). */
  delete(url: string): Promise<void>;
}

const MAX_IMAGE_DIMENSION = 1920;
const THUMB_WIDTH = 480;

async function resizeForWeb(buffer: Buffer): Promise<{ main: Buffer; thumb: Buffer }> {
  // Sempre recodificamos para WebP (remove metadados, normaliza formato,
  // reduz peso — Core Web Vitals) e limitamos a dimensão máxima.
  const main = await sharp(buffer)
    .rotate()
    .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const thumb = await sharp(buffer)
    .rotate()
    .resize({ width: THUMB_WIDTH, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();

  return { main, thumb };
}

// ---------------------------------------------------------------------------
// Driver local (disco)
// ---------------------------------------------------------------------------

const STORAGE_ROOT = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(process.cwd(), "storage", "uploads");

class LocalStorageDriver implements StorageDriver {
  async saveImage(buffer: Buffer, _originalName: string, folder: string) {
    const id = randomUUID();
    const dir = path.join(STORAGE_ROOT, folder);
    await mkdir(dir, { recursive: true });

    const { main, thumb } = await resizeForWeb(buffer);

    const mainName = `${id}.webp`;
    const thumbName = `${id}_thumb.webp`;
    await writeFile(path.join(dir, mainName), main);
    await writeFile(path.join(dir, thumbName), thumb);

    const mainPath = `${folder}/${mainName}`;
    const thumbPath = `${folder}/${thumbName}`;

    return {
      main: { path: mainPath, url: `/api/media/${mainPath}` },
      thumb: { path: thumbPath, url: `/api/media/${thumbPath}` },
    };
  }

  async delete(url: string) {
    const relativePath = url.replace(/^\/api\/media\//, "");
    try {
      await unlink(path.join(STORAGE_ROOT, relativePath));
    } catch {
      // arquivo já pode não existir — não é um erro fatal
    }
  }
}

// ---------------------------------------------------------------------------
// Driver Vercel Blob — necessário ao hospedar na Vercel (filesystem efêmero)
// ---------------------------------------------------------------------------

class VercelBlobStorageDriver implements StorageDriver {
  async saveImage(buffer: Buffer, _originalName: string, folder: string) {
    const { put } = await import("@vercel/blob");
    const id = randomUUID();
    const { main, thumb } = await resizeForWeb(buffer);

    const [mainBlob, thumbBlob] = await Promise.all([
      put(`${folder}/${id}.webp`, main, { access: "public", contentType: "image/webp" }),
      put(`${folder}/${id}_thumb.webp`, thumb, { access: "public", contentType: "image/webp" }),
    ]);

    return {
      main: { path: mainBlob.pathname, url: mainBlob.url },
      thumb: { path: thumbBlob.pathname, url: thumbBlob.url },
    };
  }

  async delete(url: string) {
    try {
      const { del } = await import("@vercel/blob");
      await del(url);
    } catch {
      // já pode não existir — não é um erro fatal
    }
  }
}

export const storage: StorageDriver = process.env.BLOB_READ_WRITE_TOKEN
  ? new VercelBlobStorageDriver()
  : new LocalStorageDriver();

export { STORAGE_ROOT };

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
