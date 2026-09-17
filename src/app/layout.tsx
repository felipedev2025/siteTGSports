import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "TG Sports — Tênis e calçados esportivos",
    template: "%s | TG Sports",
  },
  description:
    "TG Sports — tênis e calçados esportivos 100% originais. Seu esporte começa pelos pés. Enviamos para todo o Brasil.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "TG Sports",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-[var(--foreground)]">{children}</body>
    </html>
  );
}
