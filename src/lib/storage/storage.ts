// Sem `import "server-only"` aqui de propósito: este módulo também é usado
// pelo script de seed (executado fora do bundler do Next.js). Nunca é
// importado por um componente cliente.
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import sharp from "sharp";

// -----------------------------------------------------------------------------
// Abstração de armazenamento de arquivos.
// Hoje: disco local (fora de /public), servido via /api/media/[...path].
// Amanhã: trocar `LocalStorageDriver` por um driver S3/R2/CDN implementando
// a mesma interface `StorageDriver`, sem tocar no resto da aplicação.
// -----------------------------------------------------------------------------

export interface StoredFile {
  /** caminho relativo dentro do storage, usado para montar a URL pública */
  path: string;
  /** URL pública (servida pela própria aplicação) */
  url: string;
}

export interface StorageDriver {
  saveImage(buffer: Buffer, originalName: string, folder: string): Promise<{ main: StoredFile; thumb: StoredFile }>;
  delete(relativePath: string): Promise<void>;
}

const STORAGE_ROOT = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(process.cwd(), "storage", "uploads");

const MAX_IMAGE_DIMENSION = 1920;
const THUMB_WIDTH = 480;

function safeExtension(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().replace(".", "");
  const allowed = ["jpg", "jpeg", "png", "webp"];
  return allowed.includes(ext) ? ext : "jpg";
}

class LocalStorageDriver implements StorageDriver {
  async saveImage(buffer: Buffer, originalName: string, folder: string) {
    void safeExtension(originalName); // valida extensão original apenas por sanidade
    const id = randomUUID();
    const dir = path.join(STORAGE_ROOT, folder);
    await mkdir(dir, { recursive: true });

    // Sempre recodificamos para WebP (remove metadados, normaliza formato,
    // reduz peso — Core Web Vitals) e limitamos a dimensão máxima.
    const mainBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const thumbBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: THUMB_WIDTH, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    const mainName = `${id}.webp`;
    const thumbName = `${id}_thumb.webp`;

    await writeFile(path.join(dir, mainName), mainBuffer);
    await writeFile(path.join(dir, thumbName), thumbBuffer);

    const mainPath = `${folder}/${mainName}`;
    const thumbPath = `${folder}/${thumbName}`;

    return {
      main: { path: mainPath, url: `/api/media/${mainPath}` },
      thumb: { path: thumbPath, url: `/api/media/${thumbPath}` },
    };
  }

  async delete(relativePath: string) {
    try {
      await unlink(path.join(STORAGE_ROOT, relativePath));
    } catch {
      // arquivo já pode não existir — não é um erro fatal
    }
  }
}

export const storage: StorageDriver = new LocalStorageDriver();
export { STORAGE_ROOT };

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
