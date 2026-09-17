"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS: { label: string; href: string; icon: string }[] = [
  { label: "Dashboard", href: "/admin", icon: "📊" },
  { label: "Pedidos", href: "/admin/pedidos", icon: "🧾" },
  { label: "Produtos", href: "/admin/produtos", icon: "👟" },
  { label: "Categorias", href: "/admin/categorias", icon: "🗂️" },
  { label: "Marcas", href: "/admin/marcas", icon: "🏷️" },
  { label: "Estoque", href: "/admin/estoque", icon: "📦" },
  { label: "Clientes", href: "/admin/clientes", icon: "👥" },
  { label: "Cupons", href: "/admin/cupons", icon: "🎟️" },
  { label: "Banners", href: "/admin/banners", icon: "🖼️" },
  { label: "Financeiro", href: "/admin/financeiro", icon: "💰" },
  { label: "Auditoria", href: "/admin/auditoria", icon: "🛡️" },
  { label: "Configurações", href: "/admin/configuracoes", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-0.5 overflow-y-auto p-3">
      {SECTIONS.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-blue-600 text-white" : "text-tggray-200 hover:bg-white/10"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
