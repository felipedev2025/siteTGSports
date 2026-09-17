import sharp from "sharp";

// Gera uma imagem de produto "placeholder" localmente (sem depender de rede),
// usada apenas pelo seed de demonstração. Deixa claro que é conteúdo DEMO.
export async function generatePlaceholderImage(label: string, bg = "#0a1630"): Promise<Buffer> {
  const svg = `
    <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bg}" />
      <rect x="60" y="60" width="1080" height="1080" fill="none" stroke="#2f6bff" stroke-width="4" />
      <text x="600" y="560" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#ffffff" text-anchor="middle">
        TG SPORTS
      </text>
      <text x="600" y="640" font-family="Arial, sans-serif" font-size="34" fill="#5c8bff" text-anchor="middle">
        ${escapeXml(label)}
      </text>
      <text x="600" y="1120" font-family="Arial, sans-serif" font-size="24" fill="#96a0b5" text-anchor="middle">
        IMAGEM DEMONSTRATIVA — substitua pelo painel administrativo
      </text>
    </svg>
  `;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function escapeXml(str: string) {
  return str.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}
