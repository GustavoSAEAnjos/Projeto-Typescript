import { campo, elemento, selecao } from "./dom";
import type { Tipo, Midia, Status } from "./tipos";
import { buscarMidia, listarMidias } from "./api";
import { adicionarMidia } from "./servicos";

elemento("nome-do-sistema").textContent = "Filmes";
elemento("versao").textContent = "v0.3.0";
elemento("data-de-hoje").textContent = new Date().toLocaleDateString("pt-BR");

let lista: Midia[] = [];

// Diferente do que a gente fazia com o Flask no técnico, no typescript ele precisa criar o elemento no backend antes de poder mostrar no front.

function criarItem(midia: Midia): HTMLLIElement {

  // Cria o <li> (item lista)

  const item = document.createElement("li");
  const classeStatus = midia.status.replace(" ", "-");
  item.className = `midia midia--${classeStatus}`;

  // Cria o <h3>

  const titulo = document.createElement("h3");
  titulo.className = "midia_titulo";
  titulo.textContent = `#${midia.id} ${midia.titulo}`;

  // Cria a <div> que tem tudo pra ordenar

  const principal = document.createElement("div");
  principal.className = "midia__principal";
  principal.append(titulo);

  // Cria a <div> que tem as tags e o tipo

  const meta = document.createElement("div");
  meta.className = "midia__meta";

  // Cria o <span> que tem o tipo (filme ou série)

  const tipo = document.createElement("span");
  tipo.className = "etiqueta etiqueta--tipo";
  tipo.textContent = midia.tipo === "serie" ? "Série" : "Filme";

  // Cria a etiqueta de cada gênero (tag) e adiciona na div meta

  const generos = midia.tags.map((genero) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = genero;
    return tag;
  });
  meta.append(tipo, ...generos);
  principal.append(meta);

  const etiqueta = document.createElement("span");
  etiqueta.className = `etiqueta etiqueta--${classeStatus}`;
  etiqueta.textContent = midia.status;

  item.append(principal, etiqueta);
  return item;
}

// Toda vez que altera alguma coisa, ele redesenha lista completa.

function desenhar(): void {
  const itens = lista.map(criarItem);
  if (itens.length === 0) {
    const vazio = document.createElement("li");
    vazio.className = "vazio";
    vazio.textContent = "Nenhum filme ou série cadastrado no banco.";
    itens.push(vazio);
  }
  elemento("lista").replaceChildren(...itens);

  const assistidos = lista.filter((midia) => midia.status === "assisti").length;
  const assistindo = lista.filter((midia) => midia.status === "assistindo").length;
  const pendentes = lista.filter((midia) => midia.status === "quero ver").length;
  elemento("total").textContent = String(lista.length);
  elemento("assistidos").textContent = String(assistidos);
  elemento("assistindo").textContent = String(assistindo);
  elemento("pendentes").textContent = String(pendentes);
}

// Isso aqui é uma função que só funciona quando o formulario do frontend é submetido, dessa forma ele envia tudo pra ca e a função faz o que precisa.

elemento("formulario").addEventListener("submit", (evento) => {
  evento.preventDefault();
  elemento("erro").textContent = "";
  try {
    adicionarMidia(lista, {
      titulo: campo("titulo").value.trim(),
      status: lerStatus(selecao("status").value),
      tipo: lerTipo(selecao("tipo").value),
      tags: [],
    });
    campo("titulo").value = "";
    desenhar();
  } catch (erro) {
    if (erro instanceof Error) {
      elemento("erro").textContent = erro.message;
    } else {
      elemento("erro").textContent = "Não foi possível cadastrar a mídia.";
    }
  }
});

// Duas funções para ler o que o usuario coloca e verifica se é valido, se não for ele lança um erro. "A mais o usuario só consegue mandar o que tem nas opções do front bla bla bla" existem maneiras de mandar sem usar o front, só é chato e a maioria dos usuarios não sabem fazer isso.

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

// A função iniciar faz o que???? Inicia. Neste caso ela roda antes de tudo na primeria vez para desenhar a lista se não tiver nada.

async function iniciar(): Promise<void> {
  try {
    lista = await listarMidias();
    desenhar();

    const primeiraMidia = lista[0];
    if (primeiraMidia) {
      const procurada = await buscarMidia(primeiraMidia.id);
      if (procurada) {
        console.info(`Mídia encontrada: ${procurada.titulo}`);
      }
    }
  } catch (erro) {
    if (erro instanceof Error) {
      elemento("erro").textContent = erro.message;
    } else {
      elemento("erro").textContent = "Ocorreu um erro ao carregar as mídias.";
    }
  }
}

void iniciar();