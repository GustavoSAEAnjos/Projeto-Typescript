import type { Midia, NovaMidia, Sessao, Status, Tipo, Contagem, Usuario } from "./tipos";

export interface Genero {
  id: number;
  nome: string;
}

class ErroApi extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
  ) {
    super(mensagem);
  }
}

const CHAVE_SESSAO = "filmes:sessao";

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function ehStatus(valor: unknown): valor is Status {
  return valor === "quero ver" || valor === "assistindo" || valor === "assisti";
}

function ehTipo(valor: unknown): valor is Tipo {
  return valor === "filme" || valor === "serie";
}

function ehListaDeStrings(valor: unknown): valor is string[] {
  return Array.isArray(valor) && valor.every((item: unknown) => typeof item === "string");
}

export function sessaoAtual(): Sessao | undefined {
  const texto = localStorage.getItem(CHAVE_SESSAO);
  if (!texto) {
    return undefined;
  }

  try {
    const valor: unknown = JSON.parse(texto);
    if (
      objeto(valor) &&
      typeof valor.token === "string" &&
      typeof valor.nome === "string"
    ) {
      return { token: valor.token, nome: valor.nome };
    }
  } catch {
    localStorage.removeItem(CHAVE_SESSAO);
    return undefined;
  }

  localStorage.removeItem(CHAVE_SESSAO);
  return undefined;
}

export function guardarSessao(sessao: Sessao): void {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export function encerrarSessao(): void {
  localStorage.removeItem(CHAVE_SESSAO);
}

async function enviar(metodo: string, url: string, corpo?: unknown): Promise<Response> {
  const sessao = sessaoAtual();
  const headers: Record<string, string> = {};
  if (corpo !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (sessao && url !== "/api/login" && url !== "/api/usuarios") {
    headers.Authorization = `Bearer ${sessao.token}`;
  }

  const resposta = await fetch(url, {
    method: metodo,
    headers,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

  if (resposta.status === 401 && sessao && url !== "/api/login") {
    encerrarSessao();
    location.reload();
  }

  if (!resposta.ok) {
    let detalhe: unknown;
    try {
      detalhe = await resposta.json();
    } catch {
      detalhe = undefined;
    }

    const mensagem =
      objeto(detalhe) && typeof detalhe.erro === "string"
        ? detalhe.erro
        : `Erro ${resposta.status} ao comunicar com a API.`;
    throw new ErroApi(mensagem, resposta.status);
  }

  return resposta;
}

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

export async function buscarEstatisticas(): Promise<Contagem> {
  const resposta = await enviar("GET", "/api/estatisticas");
  return (await resposta.json()) as Contagem;
}

export async function listarMidias(): Promise<Midia[]> {
  const resposta = await enviar("GET", "/api/midias");
  const bruto: unknown = await resposta.json();
  if (!Array.isArray(bruto)) {
    throw new Error("A API retornou uma lista de mídias em formato inválido.");
  }
  return bruto.map(converterMidia);
}

export async function listarGeneros(): Promise<Genero[]> {
  const resposta = await enviar("GET", "/api/generos");
  const bruto: unknown = await resposta.json();
  if (
    !Array.isArray(bruto) ||
    !bruto.every(
      (genero: unknown) =>
        objeto(genero) &&
        typeof genero.id === "number" &&
        Number.isSafeInteger(genero.id) &&
        typeof genero.nome === "string",
    )
  ) {
    throw new Error("A API retornou uma lista de gêneros em formato inválido.");
  }
  return bruto;
}

export async function buscarMidia(id: number): Promise<Midia | undefined> {
  try {
    const resposta = await enviar("GET", `/api/midias/${id}`);
    return converterMidia(await resposta.json());
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) {
      return undefined;
    }
    throw erro;
  }
}

export async function cadastrarMidia(dados: NovaMidia): Promise<Midia> {
  const resposta = await enviar("POST", "/api/midias", dados);
  return converterMidia(await resposta.json());
}

export async function alterarStatus(id: number, status: Status): Promise<void> {
  await enviar("PATCH", `/api/midias/${id}/status`, { status });
}

export async function removerMidia(id: number): Promise<void> {
  await enviar("DELETE", `/api/midias/${id}`);
}

export async function criarConta(nome: string, email: string, senha: string): Promise<void> {
  await enviar("POST", "/api/usuarios", { nome, email, senha });
}

export async function entrar(email: string, senha: string): Promise<Sessao> {
  const resposta = await enviar("POST", "/api/login", { email, senha });
  const valor: unknown = await resposta.json();
  if (
    !objeto(valor) ||
    typeof valor.token !== "string" ||
    typeof valor.nome !== "string"
  ) {
    throw new Error("A API retornou uma sessão em formato inválido.");
  }
  return { token: valor.token, nome: valor.nome };
}

export async function buscarUsuarioAtual(): Promise<Usuario> {
  const resposta = await enviar("GET", "/api/eu");
  const valor: unknown = await resposta.json();
  if (
    !objeto(valor) ||
    typeof valor.id !== "number" ||
    !Number.isSafeInteger(valor.id) ||
    typeof valor.nome !== "string" ||
    typeof valor.email !== "string"
  ) {
    throw new Error("A API retornou um usuário em formato inválido.");
  }
  return { id: valor.id, nome: valor.nome, email: valor.email };
}
