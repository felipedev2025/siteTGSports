import "server-only";

export interface CepAddress {
  cep: string;
  street: string;
  district: string;
  city: string;
  state: string;
}

/** Busca endereço público via ViaCEP (serviço gratuito, sem chave). Não calcula frete real. */
export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;

    return {
      cep: digits,
      street: data.logradouro ?? "",
      district: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    return null;
  }
}
