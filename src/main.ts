import { campo, elemento, selecao } from "./dom";
import {
  alterarStatus,
  buscarUsuarioAtual,
  cadastrarMidia,
  criarConta,
  encerrarSessao,
  entrar,
  guardarSessao,
  listarGeneros,
  listarMidias,
  removerMidia,
  sessaoAtual,
  buscarEstatisticas,
} from "./api";
import type { Midia, Status, Tipo, Contagem } from "./tipos";

import {
  filtrarPorStatus,
  pesquisarPorTitulo,
  ordenarPorTitulo,
  contarPorStatus,
} from "./servicos";

elemento("nome-do-sistema").textContent = "Filmes";
elemento("versao").textContent = "v0.6.0";
elemento("data-de-hoje").textContent = new Date().toLocaleDateString("pt-BR");

let lista: Midia[] = [];

let statusSelecionado: Status | "todos" = "todos";
let termoDeBusca = "";

function mostrarErro(erro: unknown): void {
  elemento("erro").textContent =
    erro instanceof Error ? erro.message : "Ocorreu um erro inesperado.";
}

function mostrarErroEntrada(erro: unknown): void {
  elemento("erro-entrada").textContent =
    erro instanceof Error ? erro.message : "Ocorreu um erro inesperado.";
}

function botao(texto: string, classe: string, aoClicar: () => void): HTMLButtonElement {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = `botao botao--pequeno ${classe}`.trim();
  botao.textContent = texto;
  botao.addEventListener("click", aoClicar);
  return botao;
}

function criarItem(midia: Midia): HTMLLIElement {
  const item = document.createElement("li");
  const classeStatus = midia.status.replace(" ", "-");
  item.className = `midia midia--${classeStatus}`;

  const principal = document.createElement("div");
  principal.className = "midia__principal";

  const titulo = document.createElement("h3");
  titulo.className = "midia_titulo";
  titulo.textContent = `#${midia.id} ${midia.titulo}`;

  const meta = document.createElement("div");
  meta.className = "midia__meta";

  const tipo = document.createElement("span");
  tipo.className = "etiqueta etiqueta--tipo";
  tipo.textContent = midia.tipo === "serie" ? "Série" : "Filme";

  const etiquetaStatus = document.createElement("span");
  etiquetaStatus.className = `etiqueta etiqueta--${classeStatus}`;
  etiquetaStatus.textContent = midia.status;

  const generos = midia.tags.map((genero) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = genero;
    return tag;
  });

  meta.append(tipo, etiquetaStatus, ...generos);
  principal.append(titulo, meta);

  const acoes = document.createElement("div");
  acoes.className = "midia__acoes";

  const proximoStatus: Record<Status, Status> = {
    "quero ver": "assistindo",
    assistindo: "assisti",
    assisti: "quero ver",
  };
  const statusSeguinte = proximoStatus[midia.status];
  const rotuloStatus: Record<Status, string> = {
    "quero ver": "Quero ver",
    assistindo: "Assistindo",
    assisti: "Assisti",
  };

  acoes.append(
    botao(`Mudar para ${rotuloStatus[statusSeguinte]}`, "", () => {
      void atualizarStatus(midia.id, statusSeguinte);
    }),
    botao("Remover", "botao--perigo", () => {
      void removerDaLista(midia.id);
    }),
  );
  item.append(principal, acoes);
  return item;
}

function midiasVisiveis(): Midia[] {
  let resultado = lista;

  if (statusSelecionado !== "todos") {
    resultado = filtrarPorStatus(resultado, statusSelecionado);
  }

  resultado = pesquisarPorTitulo(resultado, termoDeBusca);

  return ordenarPorTitulo(resultado);
}

function exibirContagem(contagem: Contagem): void {
  elemento("total").textContent = String(
    contagem["quero ver"] +
    contagem["assistindo"] +
    contagem["assisti"]
  );

  elemento("assistidos").textContent = String(contagem["assisti"]);
  elemento("assistindo").textContent = String(contagem["assistindo"]);
  elemento("pendentes").textContent = String(contagem["quero ver"]);
}

async function atualizarPainel(): Promise<void> {
  // O reduce é útil para contar os dados já carregados no navegador.
  exibirContagem(contarPorStatus(lista));

  // O GROUP BY é melhor para consultar os totais diretamente no banco.
  exibirContagem(await buscarEstatisticas());
}

function desenhar(atualizarEstatisticas = true): void {
  const itens = midiasVisiveis().map(criarItem);

  if (itens.length === 0) {
    const vazio = document.createElement("li");
    vazio.className = "vazio";
    vazio.textContent = "Nenhum filme ou série encontrado.";
    itens.push(vazio);
  }

  elemento("lista").replaceChildren(...itens);

  if (atualizarEstatisticas) {
  atualizarPainel().catch(mostrarErro);
}
}

campo("busca").addEventListener("input", () => {
  termoDeBusca = campo("busca").value;
  desenhar(false);
});

elemento("filtros-status").addEventListener("click", (evento) => {
  const alvo = evento.target;

  if (!(alvo instanceof HTMLButtonElement)) {
    return;
  }

  const status = alvo.dataset.status;

  if (status === "todos") {
    statusSelecionado = "todos";
  } else {
    statusSelecionado = lerStatus(status ?? "");
  }

  elemento("filtros-status").querySelectorAll("button").forEach((botao) => {
    botao.classList.toggle("botao--primario", botao === alvo);
  });

  desenhar(false);
});

function lerStatus(valor: string): Status {
  if (valor === "quero ver" || valor === "assistindo" || valor === "assisti") {
    return valor;
  }
  throw new Error("Selecione um status válido.");
}

function lerTipo(valor: string): Tipo {
  if (valor === "filme" || valor === "serie") {
    return valor;
  }
  throw new Error("Selecione um tipo válido.");
}

elemento("formulario").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  elemento("erro").textContent = "";

  try {
    const novaMidia = await cadastrarMidia({
      titulo: campo("titulo").value.trim(),
      status: lerStatus(selecao("status").value),
      tipo: lerTipo(selecao("tipo").value),
      tags: Array.from(selecao("generos").selectedOptions, (opcao) => opcao.value),
    });

    lista = [...lista, novaMidia];
    (elemento("formulario") as HTMLFormElement).reset();
    desenhar();
  } catch (erro) {
    mostrarErro(erro);
  }
});

async function atualizarStatus(id: number, status: Status): Promise<void> {
  elemento("erro").textContent = "";
  try {
    await alterarStatus(id, status);
    lista = lista.map((midia) => (midia.id === id ? { ...midia, status } : midia));
    desenhar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

async function removerDaLista(id: number): Promise<void> {
  if (!window.confirm(`Remover a mídia #${id} do catálogo?`)) {
    return;
  }

  elemento("erro").textContent = "";
  try {
    await removerMidia(id);
    lista = lista.filter((midia) => midia.id !== id);
    desenhar();
  } catch (erro) {
    mostrarErro(erro);
  }
}

function preencherGeneros(nomes: string[]): void {
  const opcoes = nomes.map((nome) => {
    const opcao = document.createElement("option");
    opcao.value = nome;
    opcao.textContent = nome;
    return opcao;
  });
  selecao("generos").replaceChildren(...opcoes);
}

function mostrarFormulario(criando: boolean): void {
  elemento("form-criar").hidden = !criando;
  elemento("form-entrar").hidden = criando;
  elemento("alternar-entrada").textContent = criando ? "Já tenho conta" : "Ainda não tenho conta";
  elemento("erro-entrada").textContent = "";
}

elemento("alternar-entrada").addEventListener("click", () => {
  mostrarFormulario(elemento("form-criar").hidden === true);
});

elemento("form-entrar").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  elemento("erro-entrada").textContent = "";
  const senha = campo("entrar-senha").value;

  try {
    guardarSessao(await entrar(campo("entrar-email").value.trim(), senha));
    campo("entrar-senha").value = "";
    await iniciar();
  } catch (erro) {
    mostrarErroEntrada(erro);
  }
});

elemento("form-criar").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  elemento("erro-entrada").textContent = "";

  const nome = campo("criar-nome").value.trim();
  const email = campo("criar-email").value.trim();
  const senha = campo("criar-senha").value;

  try {
    await criarConta(nome, email, senha);
    guardarSessao(await entrar(email, senha));
    (elemento("form-criar") as HTMLFormElement).reset();
    await iniciar();
  } catch (erro) {
    mostrarErroEntrada(erro);
  }
});

elemento("botao-sair").addEventListener("click", () => {
  encerrarSessao();
  lista = [];
  (elemento("form-entrar") as HTMLFormElement).reset();
  (elemento("form-criar") as HTMLFormElement).reset();
  mostrarFormulario(false);
  void iniciar();
});

async function iniciar(): Promise<void> {
  const sessao = sessaoAtual();
  elemento("tela-entrada").hidden = sessao !== undefined;
  elemento("tela-app").hidden = sessao === undefined;
  elemento("botao-sair").hidden = sessao === undefined;
  elemento("usuario-nome").textContent = "";

  if (!sessao) {
    return;
  }

  elemento("erro-entrada").textContent = "";
  const [usuario, midias, generos] = await Promise.allSettled([
    buscarUsuarioAtual(),
    listarMidias(),
    listarGeneros(),
  ]);

  if (usuario.status === "fulfilled") {
    elemento("usuario-nome").textContent = usuario.value.nome;
  } else {
    mostrarErro(usuario.reason);
  }

  if (midias.status === "fulfilled") {
    lista = midias.value;
    desenhar();
  } else {
    mostrarErro(midias.reason);
  }

  if (generos.status === "fulfilled") {
    preencherGeneros(generos.value.map((genero) => genero.nome));
  } else if (midias.status === "fulfilled") {
    mostrarErro(generos.reason);
  }
}

mostrarFormulario(false);
void iniciar();
