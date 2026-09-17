import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Em desenvolvimento (ou qualquer host com disco persistente), as imagens
    // são servidas pela própria aplicação via /api/media — não precisa de
    // remotePatterns. Na Vercel, o driver de storage muda automaticamente
    // para o Vercel Blob (filesystem das functions é efêmero), cujo domínio
    // público é liberado abaixo.
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
