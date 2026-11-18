// Essas linhas deixam bem claro o que pode ser colocado em cada lugar

export type Status = "quero ver" | "assistindo" | "assisti";
export type Tipo = "serie" | "filme";

// Objeto.

export interface Midia {
  readonly id: number;
  titulo: string;
  tipo: Tipo;
  status: Status;
  tags: string[];
}

export interface Sessao {
  token: string;
  nome: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

// Exporta o objeto pra todas as paginas que precisarem, só que omite o ID para que não seja possível mexer nele.
export type NovaMidia = Omit<Midia, "id">;
