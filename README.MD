# Catálogo de filmes e séries

Aplicação em TypeScript com uma interface Vite e uma API Express que consulta o MySQL do XAMPP. A API preserva o tema do catálogo e lê as tabelas `Midias`, `Generos` e `MidiaGenero`.

## Requisitos

- Node.js 20.19+ e npm
- MySQL/MariaDB do XAMPP iniciado
- Banco `CatalogoMidias` criado com as tabelas descritas em [docs/SQL.md](./docs/SQL.md)

## Configuração

Na raiz do projeto, copie `.env.example` para `.env` e ajuste as credenciais caso sejam diferentes das configurações padrão do XAMPP:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=CatalogoMidias
API_PORT=3000
```

O arquivo `.env` é local e não deve ser enviado ao Git.

## Executar

```sh
npm install
npm run dev
```

O comando inicia a API em `http://localhost:3000` e a interface Vite em `http://localhost:5173` (ou na próxima porta disponível). A interface encaminha as chamadas `/api` para a API.

- `GET http://localhost:3000/api/midias` lista filmes e séries, incluindo seus gêneros.
- `GET http://localhost:3000/api/midias/3` busca uma mídia; um ID inexistente responde com HTTP 404.

O formulário continua cadastrando itens apenas na lista da tela, conforme o escopo da Aula 3 do material. O cadastro persistente no banco não faz parte dessa etapa.

## Verificar e compilar

```sh
npm run verificar
npm run build
```
