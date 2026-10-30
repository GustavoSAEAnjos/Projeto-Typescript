// Isso aqui é a adição das primeiras 6 midias do sistema. Só pra ficar igual a do professor.
import type { Midia } from "./tipos";

export const midias: Midia[] = [
  {
    id: 1,
    titulo: "Breaking Bad",
    tipo: "serie",
    status: "assisti",
    tags: ["Drama", "Policia", "Thriller"],
    criadaEm: new Date(),
  },
  {
    id: 2,
    titulo: "A Origem",
    tipo: "filme",
    status: "assistindo",
    tags: ["Ficção Científica", "Ação", "Susupense"],
    criadaEm: new Date(),
  },
  {
    id: 3,
    titulo: "Riverdale",
    tipo: "serie",
    status: "quero ver",
    tags: ["Drama Adolescente", "Mistério"],
    criadaEm: new Date(),
  },
  {
    id: 4,
    titulo: "Parasita",
    tipo: "filme",
    status: "assisti",
    tags: ["Drama", "Suspense", "Comédia Negra"],
    criadaEm: new Date(),
  },
  {
    id: 5,
    titulo: "Stranger Things",
    tipo: "serie",
    status: "assistindo",
    tags: ["Ficção Científica", "Horror", "Drama", "Fantasia"],
    criadaEm: new Date(),
  },
  {
    id: 6,
    titulo: "O Oitavo Passageiro",
    tipo: "serie",
    status: "quero ver",
    tags: ["Ficção Científica", "Horror", "Terror"],
    criadaEm: new Date(),
  },
];
