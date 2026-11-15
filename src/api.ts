import type { Midia, Status, Tipo } from "./tipos";

// Verifica se o valor recebido é um objeto e não é nulo.
function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

// Confere se o valor corresponde a um dos status usados pelas mídias.
function ehStatus(valor: unknown): valor is Status {
  return valor === "quero ver" || valor === "assistindo" || valor === "assisti";
}

// Confere se o valor corresponde a um dos tipos de mídia aceitos.
function ehTipo(valor: unknown): valor is Tipo {
  return valor === "filme" || valor === "serie";
}

// Verifica se o valor é uma lista formada somente por textos.
function ehListaDeStrings(valor: unknown): valor is string[] {
  return Array.isArray(valor) && valor.every((item: unknown) => typeof item === "string");
}

// Valida os dados recebidos da API e transforma o valor em uma mídia.
function converterMidia(valor: unknown): Midia {
  if (
    !objeto(valor) ||
    typeof valor.id !== "number" ||
    !Number.isSafeInteger(valor.id) ||
    typeof valor.titulo !== "string" ||
    !ehStatus(valor.status) ||
    !ehTipo(valor.tipo) ||
    !ehListaDeStrings(valor.tags)
  ) {
    throw new Error("A API retornou uma mídia em formato inválido.");
  }

  return {
    id: valor.id,
    titulo: valor.titulo,
    status: valor.status,
    tipo: valor.tipo,
    tags: valor.tags,
  };
}

// Busca todas as mídias na API e verifica se a resposta está no formato esperado.
export async function listarMidias(): Promise<Midia[]> {
  const resposta = await fetch("/api/midias");
  if (!resposta.ok) {
    throw new Error("Não foi possível carregar as mídias. Verifique se a API está rodando.");
  }

  const bruto: unknown = await resposta.json();
  if (!Array.isArray(bruto)) {
    throw new Error("A API retornou uma lista de mídias em formato inválido.");
  }

  return bruto.map(converterMidia);
}

// Busca uma mídia pelo ID; retorna undefined se ela não for encontrada.
export async function buscarMidia(id: number): Promise<Midia | undefined> {
  const resposta = await fetch(`/api/midias/${id}`);
  if (resposta.status === 404) {
    return undefined;
  }
  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status} ao buscar a mídia #${id}.`);
  }

  return converterMidia(await resposta.json());
}
