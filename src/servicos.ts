// Importa NovaMidia e Midia de tipos.ts e esse arquivo todo é apenas algumas funções que serão usadas em outros arquivos.

import type { NovaMidia, Midia } from "./tipos";

// Gera o próximo id a partir do maior id já existente
function gerarId(lista: Midia[]): number {
    let maior = 0;
    for (const midia of lista) {
        if (midia.id > maior) {
            maior = midia.id;
        }
    }
    return maior + 1;
}

// Cadastra uma midia: o usuário informa só o essencial
export function adicionarMidia(lista: Midia[], dados: NovaMidia): Midia {
    const tarefa: Midia = {
        ...dados,
        id: gerarId(lista),
        criadaEm: new Date(),
    };
    lista.push(tarefa);
    return tarefa;
}

// Recebe a lista de midia e uma "regra", isso faz com que tudo seja estrturado da maneira correta.

export function transformar<T, R>(lista: T[], regra: (item: T) => R): R[] {
    const resultado: R[] = [];
    for (const item of lista) {
        resultado.push(regra(item));
    }
    return resultado;
}
