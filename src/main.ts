import { campo, elemento, selecao } from "./dom";

import { midias } from "./dados";

import type { Tipo, Midia, Status } from "./tipos";

import { adicionarMidia, transformar } from "./servicos";

// Essas proxímas 3 linhas com a função elemento() servem apenas para colocar no header do site as informações de nome, versão e a data do dia

elemento("nome-do-sistema").textContent = "Filmes";

elemento("versao").textContent = "v0.2.0";

elemento("data-de-hoje").textContent = new Date().toLocaleDateString("pt-BR");

// O estado do programa: a lista que está valendo agora. Em outras palavras, a lista atual com todos os filmes e séries cadastrados.

const lista: Midia[] = [...midias];

// Isso cria cada item da lista para que eles sejam jogados no html. Aqui eles viram <li> (list item). Dá pra perceber isso graças a o que aparece depois dos : (dois pontos) que é "HTMLLIElement" ou "HTML LI (List Item) ELement" "Elemento HTML de Item de Lista".

function criarItem(midia: Midia): HTMLLIElement {

  const item = document.createElement("li");
  const classeStatus = midia.status.replace(" ", "-");
  item.className = `midia midia--${classeStatus}`;

  const titulo = document.createElement("h3");
  titulo.className = "midia_titulo";

  titulo.textContent = `#${midia.id} ${midia.titulo}`;
  const etiqueta = document.createElement("span");

  etiqueta.className = `etiqueta etiqueta--${classeStatus}`;
  etiqueta.textContent = midia.status;

  item.append(titulo, etiqueta);
  return item;
}

// A função que desenha a tela inteira a partir da lista

function desenhar(): void {

  const itens = transformar(lista, criarItem); // Lembra do da função transofrmar() em servicos.ts? Isso aqui usa ele junto da função criarItem(), fazendo com que cada item da lista (em outras palavras cada filme ou serie que está cadastrado) apareça corretamente no index.

  elemento("lista").replaceChildren(...itens); // Tira todos os item da lista e depois coloca eles denovo de forma atualizado.

  // O restante da função é somente para atualizar as estatisticas de total, assistidos, assistindo e pendentes (para assisitir)
  let assistidos = 0;
  let assistindo = 0;
  let pendentes = 0;

  for (const midia of lista) {
    switch (midia.status) {
      case "assisti":
        assistidos++;
        break;
      case "assistindo":
        assistindo++;
        break;
      case "quero ver":
        pendentes++;
        break;
    }
  }
  // Isso aqui que altera os textos de verdade
  elemento("total").textContent = String(lista.length);
  elemento("assistidos").textContent = String(assistidos);
  elemento("assistindo").textContent = String(assistindo);
  elemento("pendentes").textContent = String(pendentes);
}

// O formulário: a função abaixo é um CALLBACK — quem a chama é o navegador

elemento("formulario").addEventListener("submit", (evento) => {
  evento.preventDefault(); // sem isto, a página recarrega e tudo se perde
  elemento("erro").textContent = "";
  try {
    adicionarMidia(lista, {
      titulo: campo("titulo").value.trim(),
      status: selecao("status").value as Status,
      tipo: selecao("tipo").value as Tipo,
      tags: [],
    });
    campo("titulo").value = "";
    desenhar(); // mudou a lista? desenhe de novo
  } catch (erro) {
    if (erro instanceof Error) {
      elemento("erro").textContent = erro.message;
    }
  }
});
desenhar();