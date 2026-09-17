import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Imagens de produto são servidas pela própria aplicação via /api/media,
    // então não é necessário remotePatterns em desenvolvimento. Ao migrar
    // para um storage externo/CDN, adicionar o domínio aqui.
    minimumCacheTTL: 60 * 60 * 24,
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
