import type { Midia, Status, Contagem } from "./tipos";

export function filtrarPorStatus(lista: Midia[], status: Status): Midia[] {
  return lista.filter((midia) => midia.status === status);
}

export function pesquisarPorTitulo(lista: Midia[], termo: string): Midia[] {
  const procurado = termo.trim().toLowerCase();

  return lista.filter((midia) => midia.titulo.toLowerCase().includes(procurado));
}

export function contarPorStatus(lista: Midia[]): Contagem {
  return lista.reduce<Contagem>(
    (acumulador, midia) => {
      acumulador[midia.status]++;
      return acumulador;
    },
    {
      "quero ver": 0,
      "assistindo": 0,
      "assisti": 0
    }
  );
}

export function ordenarPorTitulo(lista: Midia[]): Midia[] {
  return [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo));
}