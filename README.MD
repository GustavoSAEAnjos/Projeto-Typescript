# Catálogo de filmes e séries

Aplicação TypeScript com interface Vite, API Express e MySQL. Mantém o tema de catálogo pessoal de filmes e séries.

## Estrutura

- `index.html`: tela de login e catálogo.
- `src/`: tipos, serviços e integração da página com a API.
- `api/src/`: API, autenticação JWT e acesso ao MySQL.
- `css/filmes.css`: estilos da interface.
- `docs/SQL.md`: modelo e exemplos do banco.
- `docs/banco.sql`: script completo para recriar o banco.
- `docs/TaskFlow_Aula7_ALUNO.pdf`: documento da avaliação.
- `docs/imagens/`: imagens do DER.

## Requisitos

- Node.js 20.19 ou superior
- npm
- MySQL/MariaDB do XAMPP

## Configuração do banco

1. Inicie o MySQL pelo XAMPP.
2. Execute o script completo:

```sh
mysql -u root -p < docs/banco.sql
```

No Windows, execute o comando em um terminal aberto na raiz do projeto. O script cria o banco `catalogomidias`, as quatro tabelas, as restrições e os dados iniciais.

Conta de demonstração criada pelo script:

- E-mail: `demo@filmes.local`
- Senha: `demo123`

## Configuração da aplicação

Copie `.env.exemplo` para `.env` e ajuste as credenciais:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=catalogomidias
API_PORT=3000
JWT_SEGREDO=gere-um-segredo-aleatorio-com-pelo-menos-32-caracteres
```

O arquivo `.env` não é versionado e contém configurações locais. Gere um segredo com:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## Instalação e execução

```sh
npm install
npm run dev
```

A interface fica em `http://localhost:5173` e a API em `http://localhost:3000`.

## Verificação

```sh
npm run verificar
npm run build
```

## Requisitos implementados

- Quatro tabelas: `usuarios`, `Midias`, `Generos` e `MidiaGenero`, com chave estrangeira.
- CHECK para status e tipo em `Midias`, UNIQUE para e-mail e gênero.
- Cadastro/login com bcrypt e JWT.
- CRUD completo de mídias persistido no MySQL.
- Busca e filtros no navegador.
- Painel com total, assistidos, assistindo e pendentes.
- Consultas SQL com JOIN e GROUP BY.
- SQL com parâmetros e transações nas operações relacionadas.
- DER em `docs/imagens/diagrama.png` e `docs/diagrama-brModelo.brM3`.

## Filtros no navegador e no SQL

A busca por título e os filtros visuais são aplicados no navegador sobre os dados já carregados pela API: isso evita requisições a cada tecla e permite respostas imediatas. A proteção e a contagem por usuário são feitas no MySQL com `WHERE idUsuario = ?`, `JOIN` e `GROUP BY`, pois essa operação precisa usar os dados persistidos e impedir que um usuário acesse outro usuário. O filtro de busca de texto digitado não é enviado diretamente ao SQL.
