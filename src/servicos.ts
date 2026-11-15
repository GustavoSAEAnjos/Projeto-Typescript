import type { NovaMidia, Midia } from "./tipos";
// Garante que não tenham dois IDs iguais.
function gerarId(lista: Midia[]): number {
    let maior = 0;
    for (const midia of lista) {
        if (midia.id > maior) {
            maior = midia.id;
        }
    }
    return maior + 1;
}
// Adiciona a midia na lista.
export function adicionarMidia(lista: Midia[], dados: NovaMidia): Midia {
    const midia: Midia = {
        ...dados,
        id: gerarId(lista),
    };
    lista.push(midia);
    return midia;
}
