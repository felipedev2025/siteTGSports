import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-tggray-100 bg-navy-950 text-tggray-200">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white">
              TG
            </span>
            <span className="text-lg font-extrabold text-white">TG Sports</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-tggray-400">
            Tênis e calçados esportivos 100% originais. Performance, tecnologia e estilo para o seu esporte.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-white">Institucional</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/sobre" className="hover:text-white">Sobre nós</Link></li>
            <li><Link href="/contato" className="hover:text-white">Contato</Link></li>
            <li><Link href="/perguntas-frequentes" className="hover:text-white">Dúvidas frequentes</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-white">Minha conta</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/minha-conta" className="hover:text-white">Entrar</Link></li>
            <li><Link href="/minha-conta/pedidos" className="hover:text-white">Meus pedidos</Link></li>
            <li><Link href="/trocas-e-devolucoes" className="hover:text-white">Trocas e devoluções</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-white">Políticas</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/politica-de-privacidade" className="hover:text-white">Privacidade</Link></li>
            <li><Link href="/termos-de-uso" className="hover:text-white">Termos de uso</Link></li>
            <li><Link href="/politica-de-entrega" className="hover:text-white">Entrega</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-tggray-400 sm:flex-row">
          <span>© {new Date().getFullYear()} TG Sports · Jaú/SP · Todos os direitos reservados</span>
          <div className="flex items-center gap-3">
            <span className="rounded bg-white/10 px-2 py-1 font-semibold text-white">Pagamento seguro</span>
            <span>PIX</span>
            <span>Cartão de crédito</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
