// Isso aqui é o negócio que ele passou para ter somente essas coisas nas variaveis (Não é possível colocar nada de diferente nelas, fazendo com que o código flua sme erros)
export type Status = "quero ver" | "assistindo" | "assisti";
export type Tipo = "serie" | "filme";

// Isso é literalmente um objeto. Acho que não preciso explicar, mas é baiscamente um molde para qualquer midia que for adicionada no sistema, ter garantia que vai ter todos os campos nescessários.

export interface Midia {
  readonly id: number;
  titulo: string;
  tipo: Tipo;
  status: Status;
  tags: string[];
  criadaEm: Date;
}

// Isso omite o id e o criada em, não lembro onde no código
export type NovaMidia = Omit<Midia, "id" | "criadaEm">;
