import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { MobileNav } from "./MobileNav";
import { FavoritesCount } from "./FavoritesCount";
import { NAV_LINKS } from "./nav-links";
import { Logo } from "./Logo";

export function Header({ cartCount, logoUrl }: { cartCount: number; logoUrl?: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-tggray-100 bg-white/95 backdrop-blur">
      <div className="bg-navy-900 text-center text-[11px] font-medium tracking-wide text-white py-1.5 px-4">
        Enviamos para todo o Brasil · Tênis 100% originais
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:px-8">
        <MobileNav />

        <Link href="/" className="shrink-0">
          <Logo logoUrl={logoUrl} textClassName="hidden text-lg font-extrabold tracking-tight text-navy-900 sm:block" />
        </Link>

        <div className="hidden flex-1 lg:block lg:max-w-md">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/minha-conta"
            className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-navy-800 hover:bg-tggray-50 lg:flex"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
            </svg>
            Minha conta
          </Link>

          <Link href="/favoritos" className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-tggray-50">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0b1220" strokeWidth="2">
              <path d="M12 21s-7.5-4.35-10-9.14C.5 8.5 2.5 4 6.5 4c2 0 3.5 1.2 5.5 3.5C14 5.2 15.5 4 17.5 4c4 0 6 4.5 4.5 7.86C19.5 16.65 12 21 12 21z" />
            </svg>
            <FavoritesCount />
          </Link>

          <Link href="/carrinho" className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-tggray-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0b1220" strokeWidth="2">
              <path d="M6 6h15l-1.5 9h-12L6 6Z" strokeLinejoin="round" />
              <path d="M6 6 5 2H2" strokeLinecap="round" />
              <circle cx="9.5" cy="20" r="1.4" />
              <circle cx="17.5" cy="20" r="1.4" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <nav className="hidden border-t border-tggray-100 lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3.5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-navy-800 transition hover:text-blue-600"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
