import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-950">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(47,107,255,0.35), transparent 45%), radial-gradient(circle at 85% 75%, rgba(47,107,255,0.25), transparent 40%)",
        }}
      />
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:py-24 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-28">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200 ring-1 ring-white/15">
            Tênis 100% originais
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Seu esporte
            <br />
            começa <span className="text-blue-400">pelos pés.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-tggray-200/90 sm:text-lg">
            Performance, tecnologia e estilo em cada passo. Enviamos para todo o Brasil, com pagamento seguro via PIX
            ou cartão.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/produtos"
              className="rounded-full bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
            >
              COMPRAR AGORA
            </Link>
            <Link
              href="/produtos?oferta=1"
              className="rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
            >
              VER OFERTAS
            </Link>
          </div>
        </div>

        <div className="grid w-full max-w-sm grid-cols-2 gap-3 lg:w-auto">
          {[
            { label: "Entrega rápida", desc: "Para todo o Brasil" },
            { label: "Pagamento seguro", desc: "PIX e cartão" },
            { label: "100% originais", desc: "Direto das melhores marcas" },
            { label: "Troca facilitada", desc: "Conforme nossa política" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur">
              <p className="text-sm font-bold text-white">{item.label}</p>
              <p className="mt-0.5 text-xs text-tggray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
